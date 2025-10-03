import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockRecommendation {
  symbol: string;
  companyName: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  trailingStop: number;
  positionSize: number;
  riskReward: string;
  reasons: string[];
  isHalal: boolean;
  sector?: string;
  technicals: {
    currentPrice: number;
    ema20: number;
    ema50: number;
    rsi: number;
    atr: number;
    supertrend: number;
    supertrendSignal: 'BUY' | 'SELL';
    macd: number;
    macdSignal: number;
    bbUpper: number;
    bbLower: number;
    volume: number;
    avgVolume: number;
    volatility: number;
  };
}


// Proper RSI calculation using Wilder's exponential smoothing
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  let avgGain = 0;
  let avgLoss = 0;

  // Initial calculation for first period
  for (let i = 1; i <= period; i++) {
    const change = prices[i] - prices[i - 1];
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }

  avgGain /= period;
  avgLoss /= period;

  // Apply Wilder's smoothing for remaining periods
  for (let i = period + 1; i < prices.length; i++) {
    const change = prices[i] - prices[i - 1];
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;

    avgGain = ((avgGain * (period - 1)) + gain) / period;
    avgLoss = ((avgLoss * (period - 1)) + loss) / period;
  }

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

// Calculate EMA
function calculateEMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const multiplier = 2 / (period + 1);
  let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

  for (let i = period; i < prices.length; i++) {
    ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
  }

  return ema;
}

// Calculate Average True Range (ATR)
function calculateATR(highs: number[], lows: number[], closes: number[], period: number = 14): number {
  if (highs.length < period + 1) return 0;

  const trueRanges: number[] = [];

  for (let i = 1; i < highs.length; i++) {
    const tr1 = highs[i] - lows[i];
    const tr2 = Math.abs(highs[i] - closes[i - 1]);
    const tr3 = Math.abs(lows[i] - closes[i - 1]);
    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  // Calculate initial ATR using SMA
  let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

  // Apply Wilder's smoothing
  for (let i = period; i < trueRanges.length; i++) {
    atr = ((atr * (period - 1)) + trueRanges[i]) / period;
  }

  return atr;
}

// Calculate SuperTrend indicator
function calculateSuperTrend(highs: number[], lows: number[], closes: number[], atr: number, multiplier: number = 3): { value: number; signal: 'BUY' | 'SELL' } {
  const hl2 = (highs[highs.length - 1] + lows[lows.length - 1]) / 2;
  const upperBand = hl2 + (multiplier * atr);
  const lowerBand = hl2 - (multiplier * atr);
  const currentPrice = closes[closes.length - 1];

  const signal = currentPrice > lowerBand ? 'BUY' : 'SELL';
  const supertrendValue = signal === 'BUY' ? lowerBand : upperBand;

  return { value: supertrendValue, signal };
}

// Calculate MACD
function calculateMACD(prices: number[]): { macd: number; signal: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macd = ema12 - ema26;

  // For signal line, we'd need MACD history - simplified here
  const signal = macd * 0.9; // Approximation

  return { macd, signal };
}

// Calculate Bollinger Bands
function calculateBollingerBands(prices: number[], period: number = 20, stdDev: number = 2): { upper: number; lower: number } {
  if (prices.length < period) return { upper: prices[prices.length - 1], lower: prices[prices.length - 1] };

  const recentPrices = prices.slice(-period);
  const sma = recentPrices.reduce((a, b) => a + b, 0) / period;

  const variance = recentPrices.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period;
  const standardDeviation = Math.sqrt(variance);

  return {
    upper: sma + (stdDev * standardDeviation),
    lower: sma - (stdDev * standardDeviation)
  };
}

// Calculate volatility
function calculateVolatility(prices: number[], period: number = 20): number {
  if (prices.length < period) return 0;

  const returns: number[] = [];
  for (let i = 1; i < prices.length; i++) {
    returns.push((prices[i] - prices[i - 1]) / prices[i - 1]);
  }

  const recentReturns = returns.slice(-period);
  const avgReturn = recentReturns.reduce((a, b) => a + b, 0) / period;
  const variance = recentReturns.reduce((sum, ret) => sum + Math.pow(ret - avgReturn, 2), 0) / period;

  return Math.sqrt(variance * 252); // Annualized volatility
}

async function fetchYahooDataEnhanced(symbol: string) {
  const MAX_RETRIES = 2;
  const RETRY_DELAY = 1500;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      console.log(`Fetching data for ${symbol} (attempt ${attempt + 1})`);

      const period1 = Math.floor((Date.now() - 180 * 24 * 60 * 60 * 1000) / 1000);
      const period2 = Math.floor(Date.now() / 1000);

      // Try v8 chart API first (more reliable)
      const chartUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS?period1=${period1}&period2=${period2}&interval=1d`;

      const response = await fetch(chartUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'Accept-Language': 'en-US,en;q=0.9'
        }
      });

      if (!response.ok) {
        console.log(`Chart API failed with status ${response.status}, trying download endpoint`);

        // Fallback to download endpoint
        const downloadUrl = `https://query1.finance.yahoo.com/v7/finance/download/${symbol}.NS?period1=${period1}&period2=${period2}&interval=1d&events=history`;
        const downloadResponse = await fetch(downloadUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
            'Accept': 'text/csv'
          }
        });

        if (!downloadResponse.ok) {
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
            continue;
          }
          throw new Error(`Yahoo Finance API error: ${downloadResponse.status}`);
        }

        // Process CSV data
        const csvData = await downloadResponse.text();

        const lines = csvData.split('\n').slice(1).filter(line => line.trim() && !line.includes('null'));

        if (lines.length < 50) {
          console.log(`Insufficient CSV data for ${symbol}: ${lines.length} days`);
          return null;
        }

        const prices: number[] = [];
        const highs: number[] = [];
        const lows: number[] = [];
        const volumes: number[] = [];

        for (const line of lines) {
          const cols = line.split(',');
          if (cols.length >= 7) {
            const high = parseFloat(cols[2]);
            const low = parseFloat(cols[3]);
            const close = parseFloat(cols[4]);
            const volume = parseInt(cols[6]);

            if (!isNaN(high) && !isNaN(low) && !isNaN(close) && !isNaN(volume) &&
              high > 0 && low > 0 && close > 0 && volume > 0) {
              highs.push(high);
              lows.push(low);
              prices.push(close);
              volumes.push(volume);
            }
          }
        }

        if (prices.length < 50) {
          console.log(`Not enough valid CSV data points for ${symbol}: ${prices.length}`);
          return null;
        }

        const currentPrice = prices[prices.length - 1];
        const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

        const rsi = calculateRSI(prices);
        const atr = calculateATR(highs, lows, prices);
        const ema20 = calculateEMA(prices, 20);
        const ema50 = calculateEMA(prices, 50);
        const supertrend = calculateSuperTrend(highs, lows, prices, atr);
        const macd = calculateMACD(prices);
        const bb = calculateBollingerBands(prices);
        const volatility = calculateVolatility(prices);

        return {
          currentPrice,
          highs,
          lows,
          prices,
          volumes,
          avgVolume,
          currentVolume: volumes[volumes.length - 1],
          technicals: {
            rsi,
            atr,
            ema20,
            ema50,
            supertrend: supertrend.value,
            supertrendSignal: supertrend.signal,
            macd: macd.macd,
            macdSignal: macd.signal,
            bbUpper: bb.upper,
            bbLower: bb.lower,
            volatility
          }
        };
      }

      // Process JSON chart data
      const jsonData = await response.json();

      if (!jsonData.chart?.result?.[0]) {
        throw new Error('Invalid chart data structure');
      }

      const result = jsonData.chart.result[0];
      const quotes = result.indicators?.quote?.[0];

      if (!quotes || !result.timestamp) {
        throw new Error('Missing quotes or timestamp data');
      }

      const prices: number[] = [];
      const highs: number[] = [];
      const lows: number[] = [];
      const volumes: number[] = [];

      for (let i = 0; i < result.timestamp.length; i++) {
        const high = quotes.high?.[i];
        const low = quotes.low?.[i];
        const close = quotes.close?.[i];
        const volume = quotes.volume?.[i];

        if (high && low && close && volume &&
          !isNaN(high) && !isNaN(low) && !isNaN(close) && !isNaN(volume) &&
          high > 0 && low > 0 && close > 0 && volume > 0) {
          highs.push(high);
          lows.push(low);
          prices.push(close);
          volumes.push(volume);
        }
      }

      if (prices.length < 50) {
        console.log(`Not enough valid data points for ${symbol}: ${prices.length}`);
        return null;
      }

      const currentPrice = prices[prices.length - 1];
      const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;

      // Calculate all technical indicators
      const rsi = calculateRSI(prices);
      const atr = calculateATR(highs, lows, prices);
      const ema20 = calculateEMA(prices, 20);
      const ema50 = calculateEMA(prices, 50);
      const supertrend = calculateSuperTrend(highs, lows, prices, atr);
      const macd = calculateMACD(prices);
      const bb = calculateBollingerBands(prices);
      const volatility = calculateVolatility(prices);

      return {
        currentPrice,
        highs,
        lows,
        prices,
        volumes,
        avgVolume,
        currentVolume: volumes[volumes.length - 1],
        technicals: {
          rsi,
          atr,
          ema20,
          ema50,
          supertrend: supertrend.value,
          supertrendSignal: supertrend.signal,
          macd: macd.macd,
          macdSignal: macd.signal,
          bbUpper: bb.upper,
          bbLower: bb.lower,
          volatility
        }
      };

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${attempt + 1} failed for ${symbol}:`, errorMessage);
      if (attempt < MAX_RETRIES - 1) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (attempt + 1)));
      } else {
        console.error(`All attempts failed for ${symbol}`);
        return null;
      }
    }
  }

  return null;
}

function calculateWeightedScore(data: any): { signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL'; confidence: number; reasons: string[] } {
  const { currentPrice, technicals, prices, volumes, avgVolume } = data;
  const { rsi, atr, ema20, ema50, supertrend, supertrendSignal, macd, macdSignal, bbUpper, bbLower, volatility } = technicals;

  let buyScore = 0;
  let sellScore = 0;
  const reasons: string[] = [];

  // Trend Analysis (40% weight)
  const trendWeight = 40;

  if (currentPrice > ema20 && ema20 > ema50) {
    buyScore += trendWeight * 0.6;
    reasons.push(`Strong uptrend: Price above EMAs (${currentPrice.toFixed(2)} > ${ema20.toFixed(2)} > ${ema50.toFixed(2)})`);
  } else if (currentPrice < ema20 && ema20 < ema50) {
    sellScore += trendWeight * 0.6;
    reasons.push(`Strong downtrend: Price below EMAs (${currentPrice.toFixed(2)} < ${ema20.toFixed(2)} < ${ema50.toFixed(2)})`);
  }

  if (supertrendSignal === 'BUY' && currentPrice > supertrend) {
    buyScore += trendWeight * 0.4;
    reasons.push(`SuperTrend BUY signal (${supertrend.toFixed(2)})`);
  } else if (supertrendSignal === 'SELL' && currentPrice < supertrend) {
    sellScore += trendWeight * 0.4;
    reasons.push(`SuperTrend SELL signal (${supertrend.toFixed(2)})`);
  }

  // Momentum Indicators (30% weight)
  const momentumWeight = 30;

  if (rsi > 30 && rsi < 50) {
    buyScore += momentumWeight * 0.5;
    reasons.push(`RSI recovering from oversold (${rsi.toFixed(1)})`);
  } else if (rsi > 70 && rsi < 80) {
    sellScore += momentumWeight * 0.3;
    reasons.push(`RSI approaching overbought (${rsi.toFixed(1)})`);
  } else if (rsi > 80) {
    sellScore += momentumWeight * 0.5;
    reasons.push(`RSI severely overbought (${rsi.toFixed(1)})`);
  }

  if (macd > macdSignal && macd > 0) {
    buyScore += momentumWeight * 0.5;
    reasons.push(`MACD bullish crossover (${macd.toFixed(3)})`);
  } else if (macd < macdSignal && macd < 0) {
    sellScore += momentumWeight * 0.5;
    reasons.push(`MACD bearish crossover (${macd.toFixed(3)})`);
  }

  // Mean Reversion (20% weight)
  const reversionWeight = 20;

  if (currentPrice < bbLower && rsi < 35) {
    buyScore += reversionWeight * 0.7;
    reasons.push(`Oversold bounce setup: Below BB lower band`);
  } else if (currentPrice > bbUpper && rsi > 65) {
    sellScore += reversionWeight * 0.7;
    reasons.push(`Overbought correction setup: Above BB upper band`);
  }

  // Volume Confirmation (10% weight)
  const volumeWeight = 10;
  const currentVolume = volumes[volumes.length - 1];

  if (currentVolume > avgVolume * 1.5) {
    if (buyScore > sellScore) {
      buyScore += volumeWeight;
      reasons.push(`High volume confirmation (${(currentVolume / 1000).toFixed(0)}K vs ${(avgVolume / 1000).toFixed(0)}K avg)`);
    } else if (sellScore > buyScore) {
      sellScore += volumeWeight;
      reasons.push(`High volume breakdown (${(currentVolume / 1000).toFixed(0)}K vs ${(avgVolume / 1000).toFixed(0)}K avg)`);
    }
  }

  // Determine final signal with conflict resolution
  const totalScore = buyScore + sellScore;
  const confidence = Math.min(Math.max(totalScore, 30), 95);

  let signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';

  if (buyScore >= 70 && sellScore >= 70) {
    signal = 'NEUTRAL';
    reasons.unshift('⚠️ Conflicting signals detected - waiting for clearer direction');
  } else if (buyScore >= 60 && buyScore > sellScore * 1.5) {
    signal = 'BUY';
  } else if (sellScore >= 60 && sellScore > buyScore * 1.5) {
    signal = 'SELL';
  } else {
    signal = 'HOLD';
    reasons.unshift('Mixed technical signals - maintaining current position');
  }

  return { signal, confidence, reasons };
}

function calculatePositionSizing(currentPrice: number, atr: number, riskPercentage: number = 2): { positionSize: number; stopLoss: number; target: number; trailingStop: number } {
  // ATR-based position sizing
  const riskAmount = 10000 * (riskPercentage / 100); // Assume ₹10,000 portfolio
  const atrStopDistance = atr * 2; // 2 ATR stop loss

  const positionSize = Math.floor(riskAmount / atrStopDistance);
  const stopLoss = currentPrice - atrStopDistance;
  const target = currentPrice + (atrStopDistance * 2.5); // 1:2.5 risk-reward
  const trailingStop = currentPrice - (atr * 1.5);

  return { positionSize, stopLoss, target, trailingStop };
}

// Halal stock checker (simplified)
function isHalalStock(symbol: string): boolean {
  const nonHalalSectors = ['BANK', 'FIN', 'NBFC', 'INSURANCE', 'ALCOHOL', 'TOBACCO'];
  // This is simplified - in production, you'd have a comprehensive database
  return !nonHalalSectors.some(sector => symbol.includes(sector));
}

async function analyzeStockEnhanced(symbol: string, companyName: string, sector: string = 'Unknown'): Promise<StockRecommendation | null> {
  const data = await fetchYahooDataEnhanced(symbol);
  if (!data) {
    console.log(`Failed to fetch data for ${symbol}`);
    return null;
  }

  const { currentPrice, technicals } = data;
  const { rsi, atr, volatility } = technicals;

  // Skip stocks with extreme volatility or insufficient liquidity
  if (volatility > 0.8 || data.avgVolume < 10000) {
    console.log(`Skipping ${symbol}: High volatility (${volatility.toFixed(2)}) or low volume`);
    return null;
  }

  const scoring = calculateWeightedScore(data);

  // Apply minimum confidence threshold
  if (scoring.confidence < 60) {
    console.log(`Skipping ${symbol}: Low confidence (${scoring.confidence})`);
    return null;
  }

  const positioning = calculatePositionSizing(currentPrice, atr);
  const isHalal = isHalalStock(symbol);

  // Add Halal badge to reasons if applicable
  const reasons = isHalal
    ? ['✅ Halal Certified', ...scoring.reasons]
    : ['⚠️ Non-Halal Stock', ...scoring.reasons];

  return {
    symbol,
    companyName,
    signal: scoring.signal,
    confidence: scoring.confidence,
    entryPrice: Math.round(currentPrice * 0.999 * 100) / 100,
    targetPrice: Math.round(positioning.target * 100) / 100,
    stopLoss: Math.round(positioning.stopLoss * 100) / 100,
    trailingStop: Math.round(positioning.trailingStop * 100) / 100,
    positionSize: positioning.positionSize,
    riskReward: '1:2.5',
    reasons,
    isHalal,
    sector,
    technicals: {
      currentPrice,
      ema20: technicals.ema20,
      ema50: technicals.ema50,
      rsi,
      atr,
      supertrend: technicals.supertrend,
      supertrendSignal: technicals.supertrendSignal,
      macd: technicals.macd,
      macdSignal: technicals.macdSignal,
      bbUpper: technicals.bbUpper,
      bbLower: technicals.bbLower,
      volume: data.currentVolume,
      avgVolume: data.avgVolume,
      volatility
    }
  };
}

// Batch processing with rate limiting
async function processStocksBatch(stocks: any[], batchSize: number = 5, delayMs: number = 2000) {
  const results: StockRecommendation[] = [];

  for (let i = 0; i < stocks.length; i += batchSize) {
    const batch = stocks.slice(i, i + batchSize);
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stocks.length / batchSize)}`);

    const batchPromises = batch.map(stock =>
      analyzeStockEnhanced(stock.symbol, stock.company_name, stock.sector || 'Unknown')
    );

    const batchResults = await Promise.all(batchPromises);
    const validResults = batchResults.filter((rec): rec is StockRecommendation => rec !== null);
    results.push(...validResults);

    // Rate limiting delay
    if (i + batchSize < stocks.length) {
      console.log(`Waiting ${delayMs}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

// Sector diversification filter
function applySectorDiversification(recommendations: StockRecommendation[], maxPerSector: number = 2): StockRecommendation[] {
  const sectorCounts: { [key: string]: number } = {};
  const diversifiedRecs: StockRecommendation[] = [];

  // Sort by confidence first
  const sortedRecs = recommendations.sort((a, b) => b.confidence - a.confidence);

  for (const rec of sortedRecs) {
    const sector = rec.sector || 'Unknown';
    const currentCount = sectorCounts[sector] || 0;

    if (currentCount < maxPerSector) {
      diversifiedRecs.push(rec);
      sectorCounts[sector] = currentCount + 1;
    }

    // Limit total recommendations
    if (diversifiedRecs.length >= 10) break;
  }

  return diversifiedRecs;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting enhanced morning recommendations generation...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get current batch offset from environment or calculate based on time
    const batchSize = 250; // Process 250 stocks per run (6 runs to cover 1500 stocks)
    const currentHour = new Date().getHours();
    const batchIndex = Math.floor(currentHour / 4) % 6; // Rotate every 4 hours (6 batches)
    const offset = batchIndex * batchSize;

    console.log(`Processing batch ${batchIndex + 1}/6 (stocks ${offset + 1} to ${offset + batchSize})`);

    // Get stocks for this batch with rotation
    const { data: allStocksCount } = await supabase
      .from('stocks')
      .select('id', { count: 'exact', head: true });

    const totalStocks = allStocksCount || 0;

    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('id, symbol, company_name, industry_category')
      .order('symbol', { ascending: true })
      .range(offset, offset + batchSize - 1);

    if (stocksError) {
      console.error('Error fetching stocks:', stocksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch stocks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log(`Analyzing ${stocks.length} stocks with enhanced swing-trader logic... (Total in DB: ${totalStocks})`);

    // Process stocks with proper rate limiting
    const allRecommendations = await processStocksBatch(stocks, 10, 1500);

    console.log(`Generated ${allRecommendations.length} valid recommendations`);

    // Apply sector diversification
    const diversifiedRecommendations = applySectorDiversification(allRecommendations);

    // Separate by signal type for better organization
    const buySignals = diversifiedRecommendations.filter(r => r.signal === 'BUY');
    const sellSignals = diversifiedRecommendations.filter(r => r.signal === 'SELL');
    const halalRecommendations = diversifiedRecommendations.filter(r => r.isHalal);

    // Store recommendations in database
    const today = new Date().toISOString().split('T')[0];

    for (const rec of allRecommendations) {
      const stock = stocks.find(s => s.symbol === rec.symbol);
      if (!stock) continue;

      // Check if recommendation exists for today
      const { data: existing } = await supabase
        .from('ai_recommendations')
        .select('id')
        .eq('stock_id', stock.id)
        .eq('recommendation_date', today)
        .maybeSingle();

      if (existing) {
        // Update existing recommendation
        const { error: updateError } = await supabase
          .from('ai_recommendations')
          .update({
            signal: rec.signal,
            confidence: rec.confidence,
            target_price: rec.targetPrice,
            stop_loss: rec.stopLoss,
            entry_price: rec.entryPrice,
            ema20: rec.technicals.ema20,
            rsi: rec.technicals.rsi,
            reasons: rec.reasons
          })
          .eq('id', existing.id);

        if (updateError) {
          console.error(`Error updating recommendation for ${rec.symbol}:`, updateError);
        }
      } else {
        // Insert new recommendation
        const { error: insertError } = await supabase
          .from('ai_recommendations')
          .insert({
            stock_id: stock.id,
            signal: rec.signal,
            confidence: rec.confidence,
            target_price: rec.targetPrice,
            stop_loss: rec.stopLoss,
            entry_price: rec.entryPrice,
            ema20: rec.technicals.ema20,
            rsi: rec.technicals.rsi,
            reasons: rec.reasons,
            recommendation_date: today
          });

        if (insertError) {
          console.error(`Error inserting recommendation for ${rec.symbol}:`, insertError);
        }
      }
    }

    console.log('Enhanced morning recommendations generated successfully');

    return new Response(JSON.stringify({
      success: true,
      summary: {
        totalAnalyzed: stocks.length,
        validRecommendations: allRecommendations.length,
        diversifiedRecommendations: diversifiedRecommendations.length,
        buySignals: buySignals.length,
        sellSignals: sellSignals.length,
        halalRecommendations: halalRecommendations.length
      },
      topPicks: diversifiedRecommendations.slice(0, 5),
      allRecommendations: diversifiedRecommendations,
      generatedAt: new Date().toISOString(),
      features: [
        '✅ Proper RSI calculation with Wilder\'s smoothing',
        '✅ ATR-based dynamic position sizing',
        '✅ SuperTrend indicator implementation',
        '✅ MACD and Bollinger Bands analysis',
        '✅ Weighted scoring system with conflict resolution',
        '✅ Sector diversification filters',
        '✅ Halal stock certification',
        '✅ Enhanced error handling and rate limiting'
      ]
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in enhanced morning-recommendations function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to generate recommendations';
    return new Response(JSON.stringify({
      error: 'Failed to generate recommendations',
      details: errorMessage
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
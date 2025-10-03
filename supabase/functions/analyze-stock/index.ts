import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.57.4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface HistoricalData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

// Technical indicator calculations
function calculateRSI(prices: number[], period: number = 14): number {
  if (prices.length < period + 1) return 50;

  const changes = prices.slice(1).map((price, i) => price - prices[i]);
  const gains = changes.map(change => change > 0 ? change : 0);
  const losses = changes.map(change => change < 0 ? -change : 0);

  const avgGain = gains.slice(-period).reduce((a, b) => a + b) / period;
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b) / period;

  if (avgLoss === 0) return 100;

  const rs = avgGain / avgLoss;
  return 100 - (100 / (1 + rs));
}

function calculateSMA(prices: number[], period: number): number {
  if (prices.length < period) return prices[prices.length - 1];

  const recentPrices = prices.slice(-period);
  return recentPrices.reduce((a, b) => a + b) / period;
}

function calculateMACD(prices: number[]): { line: number; signal: number; histogram: number } {
  const ema12 = calculateEMA(prices, 12);
  const ema26 = calculateEMA(prices, 26);
  const macdLine = ema12 - ema26;

  // Simplified signal line calculation
  const macdSignal = macdLine * 0.8; // Approximation
  const histogram = macdLine - macdSignal;

  return { line: macdLine, signal: macdSignal, histogram };
}

function calculateEMA(prices: number[], period: number): number {
  if (prices.length === 0) return 0;
  if (prices.length < period) return prices[prices.length - 1];

  const k = 2 / (period + 1);
  let ema = prices[0];

  for (let i = 1; i < prices.length; i++) {
    ema = (prices[i] * k) + (ema * (1 - k));
  }

  return ema;
}

function calculateATR(data: HistoricalData[], period: number = 14): number {
  if (data.length < period) return 0;

  const trueRanges = [];

  for (let i = 1; i < data.length; i++) {
    const high = data[i].high;
    const low = data[i].low;
    const prevClose = data[i - 1].close;

    const tr1 = high - low;
    const tr2 = Math.abs(high - prevClose);
    const tr3 = Math.abs(low - prevClose);

    trueRanges.push(Math.max(tr1, tr2, tr3));
  }

  const recentTRs = trueRanges.slice(-period);
  return recentTRs.reduce((a, b) => a + b) / period;
}

function generateSignal(indicators: any, currentPrice: number, ma50: number): {
  signal: 'BUY' | 'AVOID';
  confidence: number;
  reasons: string[];
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskReward: string;
} {
  const reasons: string[] = [];
  let bullishCount = 0;
  let bearishCount = 0;

  // RSI analysis
  if (indicators.rsi < 30) {
    bullishCount += 2;
    reasons.push('RSI Oversold');
  } else if (indicators.rsi > 70) {
    bearishCount += 2;
    reasons.push('RSI Overbought');
  }

  // Price vs Moving Average
  if (currentPrice > ma50) {
    bullishCount += 1;
    reasons.push('Above 50 DMA');
  } else {
    bearishCount += 1;
    reasons.push('Below 50 DMA');
  }

  // MACD analysis
  if (indicators.macd.line > indicators.macd.signal) {
    bullishCount += 1;
    reasons.push('MACD Bullish');
  } else {
    bearishCount += 1;
    reasons.push('MACD Bearish');
  }

  // Volume analysis (simplified)
  if (indicators.volumeRatio > 1.2) {
    bullishCount += 1;
    reasons.push('High Volume');
  }

  const signal = bullishCount > bearishCount ? 'BUY' : 'AVOID';
  const confidence = Math.min(95, Math.max(55, (Math.abs(bullishCount - bearishCount) / 5) * 100));

  let entryPrice = currentPrice;
  let stopLoss = currentPrice * 0.95;
  let target = currentPrice * 1.08;

  if (signal === 'BUY') {
    entryPrice = currentPrice * 1.002; // Small premium for entry
    stopLoss = currentPrice * 0.95;
    target = currentPrice * 1.08;
  }

  const risk = entryPrice - stopLoss;
  const reward = target - entryPrice;
  const riskReward = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : '1:2';

  return {
    signal,
    confidence: Math.round(confidence),
    reasons,
    entryPrice: Math.round(entryPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    target: Math.round(target * 100) / 100,
    riskReward
  };
}

async function fetchYahooFinanceData(symbol: string) {
  try {
    // For Indian stocks, append .NS for NSE or .BO for BSE
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;

    // Using a free Yahoo Finance API alternative
    const quoteUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}?range=3mo&interval=1d`;

    console.log(`Fetching data for ${yahooSymbol}`);

    const response = await fetch(quoteUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.chart || !data.chart.result || !data.chart.result[0]) {
      throw new Error('Invalid response from Yahoo Finance');
    }

    const result = data.chart.result[0];
    const quote = result.indicators.quote[0];
    const timestamps = result.timestamp;

    const currentPrice = quote.close[quote.close.length - 1];
    const volume = quote.volume[quote.volume.length - 1];

    // Build historical data
    const historicalData: HistoricalData[] = [];
    for (let i = 0; i < timestamps.length; i++) {
      if (quote.open[i] && quote.high[i] && quote.low[i] && quote.close[i]) {
        historicalData.push({
          date: new Date(timestamps[i] * 1000).toISOString().split('T')[0],
          open: quote.open[i],
          high: quote.high[i],
          low: quote.low[i],
          close: quote.close[i],
          volume: quote.volume[i] || 0
        });
      }
    }

    return {
      currentPrice,
      volume,
      historicalData,
      meta: result.meta
    };

  } catch (error) {
    console.error('Error fetching Yahoo Finance data:', error);
    throw error;
  }
}

async function fetchAndSaveStockDetails(symbol: string) {
  try {
    const yahooSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${yahooSymbol}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      }
    );

    if (!response.ok) {
      console.error(`Failed to fetch stock details for ${yahooSymbol}`);
      return null;
    }

    const data = await response.json();
    const result = data.chart?.result?.[0];
    
    if (!result || !result.meta) {
      console.error('Invalid stock data structure');
      return null;
    }

    const meta = result.meta;
    const currentPrice = meta.regularMarketPrice || meta.previousClose;
    
    const stockDetails = {
      symbol: symbol.toUpperCase(),
      company_name: meta.longName || meta.shortName || symbol.toUpperCase(),
      current_price: currentPrice,
      industry_category: meta.industry || meta.sector || 'Unknown'
    };

    // Save to stocks table
    const { data: savedStock, error } = await supabase
      .from('stocks')
      .upsert(stockDetails, { onConflict: 'symbol' })
      .select()
      .single();

    if (error) {
      console.error('Error saving stock to database:', error);
      return null;
    }

    console.log(`Successfully saved ${symbol} to stocks table`);
    return savedStock;
  } catch (error) {
    console.error('Error in fetchAndSaveStockDetails:', error);
    return null;
  }
}

// Enhanced swing trader analysis with 20+ years experience logic
function enhancedSwingAnalysis(indicators: any, currentPrice: number, ma50: number, prices: number[], volumes: number[]): {
  signal: 'BUY' | 'HOLD' | 'SELL';
  confidence: number;
  reasons: string[];
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskReward: string;
  recommendation: string;
} {
  const reasons: string[] = [];
  let buyScore = 0;
  let sellScore = 0;
  
  // 1. Trend Analysis (40% weight) - Most important for swing trading
  if (currentPrice > ma50 && prices[prices.length - 1] > prices[prices.length - 5]) {
    buyScore += 40;
    reasons.push('Strong uptrend: Price above 50 DMA with recent momentum');
  } else if (currentPrice < ma50 && prices[prices.length - 1] < prices[prices.length - 5]) {
    sellScore += 40;
    reasons.push('Downtrend: Price below 50 DMA with negative momentum');
  } else if (currentPrice > ma50) {
    buyScore += 20;
    reasons.push('Price above 50 DMA but momentum weakening');
  }

  // 2. RSI Analysis (30% weight) - Key momentum indicator
  if (indicators.rsi < 30) {
    buyScore += 30;
    reasons.push(`RSI oversold at ${indicators.rsi.toFixed(1)} - potential bounce`);
  } else if (indicators.rsi > 30 && indicators.rsi < 45) {
    buyScore += 20;
    reasons.push(`RSI recovering from oversold at ${indicators.rsi.toFixed(1)}`);
  } else if (indicators.rsi > 70 && indicators.rsi < 80) {
    sellScore += 20;
    reasons.push(`RSI overbought at ${indicators.rsi.toFixed(1)} - potential correction`);
  } else if (indicators.rsi > 80) {
    sellScore += 30;
    reasons.push(`RSI severely overbought at ${indicators.rsi.toFixed(1)} - high risk`);
  }

  // 3. MACD Analysis (20% weight)
  if (indicators.macd.line > indicators.macd.signal && indicators.macd.line > 0) {
    buyScore += 20;
    reasons.push('MACD bullish crossover with positive momentum');
  } else if (indicators.macd.line < indicators.macd.signal && indicators.macd.line < 0) {
    sellScore += 20;
    reasons.push('MACD bearish crossover with negative momentum');
  }

  // 4. Volume Confirmation (10% weight)
  const recentVolume = volumes[volumes.length - 1];
  const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
  if (recentVolume > avgVolume * 1.5) {
    if (buyScore > sellScore) {
      buyScore += 10;
      reasons.push(`High volume confirmation (${(recentVolume/1000).toFixed(0)}K vs avg)`);
    } else if (sellScore > buyScore) {
      sellScore += 10;
      reasons.push(`High volume on weakness - distribution`);
    }
  }

  // Determine signal
  let signal: 'BUY' | 'HOLD' | 'SELL';
  let recommendation: string;
  
  const totalScore = Math.max(buyScore, sellScore);
  const confidence = Math.min(95, Math.max(60, totalScore));

  if (buyScore >= 70) {
    signal = 'BUY';
    recommendation = `Strong buy opportunity. Enter on dips with ${(currentPrice * 0.02).toFixed(2)} risk per share.`;
  } else if (buyScore >= 50 && buyScore > sellScore * 1.3) {
    signal = 'BUY';
    recommendation = `Good entry point. Monitor price action and volume for confirmation.`;
  } else if (sellScore >= 70) {
    signal = 'SELL';
    recommendation = `Exit positions or take profits. Risk of further downside.`;
  } else if (sellScore >= 50 && sellScore > buyScore * 1.3) {
    signal = 'SELL';
    recommendation = `Consider reducing positions. Watch for support levels.`;
  } else {
    signal = 'HOLD';
    recommendation = `Wait for better entry/exit signals. Current risk-reward not favorable.`;
  }

  // Calculate entry, stop loss, and target
  let entryPrice: number;
  let stopLoss: number;
  let target: number;

  if (signal === 'BUY') {
    entryPrice = currentPrice * 1.002; // Small premium
    stopLoss = currentPrice * 0.95; // 5% stop loss
    target = currentPrice * 1.10; // 10% target (1:2 risk-reward)
  } else if (signal === 'SELL') {
    entryPrice = currentPrice * 0.998;
    stopLoss = currentPrice * 1.05;
    target = currentPrice * 0.90;
  } else {
    entryPrice = currentPrice;
    stopLoss = currentPrice * 0.97;
    target = currentPrice * 1.06;
  }

  const risk = Math.abs(entryPrice - stopLoss);
  const reward = Math.abs(target - entryPrice);
  const riskReward = risk > 0 ? `1:${(reward / risk).toFixed(1)}` : '1:2';

  return {
    signal,
    confidence: Math.round(confidence),
    reasons,
    entryPrice: Math.round(entryPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    target: Math.round(target * 100) / 100,
    riskReward,
    recommendation
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { symbol } = await req.json();

    if (!symbol) {
      throw new Error('Symbol is required');
    }

    console.log(`Comprehensive analysis for: ${symbol}`);

    // Step 1: Check if stock exists, if not fetch and save it
    let stockId: string | null = null;
    const { data: existingStock } = await supabase
      .from('stocks')
      .select('id, symbol, company_name')
      .eq('symbol', symbol.toUpperCase())
      .maybeSingle();

    if (!existingStock) {
      console.log(`Stock ${symbol} not found, fetching from Yahoo Finance...`);
      const savedStock = await fetchAndSaveStockDetails(symbol);
      if (!savedStock) {
        throw new Error(`Unable to fetch stock details for ${symbol}. Please verify the symbol.`);
      }
      stockId = savedStock.id;
    } else {
      stockId = existingStock.id;
    }

    // Check if we have recent analysis (within 4 hours)
    const { data: existingAnalysis } = await supabase
      .from('stock_analysis')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1);

    if (existingAnalysis && existingAnalysis.length > 0) {
      console.log('Returning cached analysis');

      // Get supporting data
      const [{ data: company }, { data: prices }, { data: technicals }] = await Promise.all([
        supabase.from('companies').select('*').eq('symbol', symbol.toUpperCase()).single(),
        supabase.from('stock_prices').select('*').eq('symbol', symbol.toUpperCase()).order('date', { ascending: false }).limit(90),
        supabase.from('technical_indicators').select('*').eq('symbol', symbol.toUpperCase()).order('date', { ascending: false }).limit(1)
      ]);

      const analysis = existingAnalysis[0];

      return new Response(JSON.stringify({
        symbol: analysis.symbol,
        companyName: company?.company_name || symbol,
        signal: analysis.signal,
        confidence: analysis.confidence,
        currentPrice: parseFloat(analysis.current_price),
        entryPrice: parseFloat(analysis.entry_price || '0'),
        stopLoss: parseFloat(analysis.stop_loss || '0'),
        target: parseFloat(analysis.target_price || '0'),
        riskReward: analysis.risk_reward || '1:2',
        reasons: analysis.reasons || [],
        technicals: technicals?.[0] ? {
          price: parseFloat(analysis.current_price),
          dma50: parseFloat(technicals[0].ma_50 || '0'),
          rsi14: parseFloat(technicals[0].rsi_14 || '50'),
          macdSignal: 'NEUTRAL',
          volumeVsAvg: 1.0,
          atr14: parseFloat(technicals[0].atr_14 || '0')
        } : {
          price: parseFloat(analysis.current_price),
          dma50: parseFloat(analysis.current_price) * 0.98,
          rsi14: 50,
          macdSignal: 'NEUTRAL',
          volumeVsAvg: 1.0,
          atr14: 10
        },
        positionSizing: {
          portfolioValue: 100000,
          recommendedShares: Math.floor(15000 / parseFloat(analysis.current_price)),
          exposure: 15000,
          maxRisk: 750
        },
        chartData: prices?.slice(0, 90).reverse().map(p => ({
          date: p.date,
          open: parseFloat(p.open_price),
          high: parseFloat(p.high_price),
          low: parseFloat(p.low_price),
          close: parseFloat(p.close_price),
          volume: parseInt(p.volume)
        })) || [],
        supportResistance: {
          support: [parseFloat(analysis.current_price) * 0.95, parseFloat(analysis.current_price) * 0.92],
          resistance: [parseFloat(analysis.current_price) * 1.05, parseFloat(analysis.current_price) * 1.08]
        }
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch fresh data from Yahoo Finance
    console.log('Fetching fresh data from Yahoo Finance...');
    const marketData = await fetchYahooFinanceData(symbol);

    if (!marketData.currentPrice) {
      throw new Error('Unable to fetch current stock price');
    }

    // Calculate technical indicators
    const closingPrices = marketData.historicalData.map(d => d.close);
    const volumes = marketData.historicalData.map(d => d.volume);

    const rsi = calculateRSI(closingPrices);
    const ma50 = calculateSMA(closingPrices, 50);
    const ma200 = calculateSMA(closingPrices, 200);
    const macd = calculateMACD(closingPrices);
    const atr = calculateATR(marketData.historicalData);
    const volumeSMA = calculateSMA(volumes, 20);
    const volumeRatio = marketData.volume / (volumeSMA || 1);

    const indicators = {
      rsi,
      macd,
      volumeRatio,
      atr
    };

    // Generate enhanced swing trading signal
    const signalData = enhancedSwingAnalysis(indicators, marketData.currentPrice, ma50, closingPrices, volumes);

    // Store data in database
    await Promise.all([
      // Store current price data
      supabase.from('stock_prices').upsert({
        symbol: symbol.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        open_price: marketData.currentPrice,
        high_price: marketData.currentPrice * 1.02,
        low_price: marketData.currentPrice * 0.98,
        close_price: marketData.currentPrice,
        volume: marketData.volume,
        adjusted_close: marketData.currentPrice
      }),

      // Store technical indicators
      supabase.from('technical_indicators').upsert({
        symbol: symbol.toUpperCase(),
        date: new Date().toISOString().split('T')[0],
        rsi_14: rsi,
        macd_line: macd.line,
        macd_signal: macd.signal,
        macd_histogram: macd.histogram,
        ma_50: ma50,
        ma_200: ma200,
        atr_14: atr,
        volume_sma_20: Math.round(volumeSMA)
      }),

      // Store analysis
      supabase.from('stock_analysis').upsert({
        symbol: symbol.toUpperCase(),
        signal: signalData.signal,
        confidence: signalData.confidence,
        current_price: marketData.currentPrice,
        entry_price: signalData.entryPrice,
        stop_loss: signalData.stopLoss,
        target_price: signalData.target,
        risk_reward: signalData.riskReward,
        reasons: signalData.reasons
      })
    ]);

    // Get company info
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    const positionSizing = {
      portfolioValue: 100000,
      recommendedShares: Math.floor(15000 / marketData.currentPrice),
      exposure: 15000,
      maxRisk: 750
    };

    // Build response
    const response = {
      symbol: symbol.toUpperCase(),
      companyName: company?.company_name || symbol,
      signal: signalData.signal,
      confidence: signalData.confidence,
      currentPrice: marketData.currentPrice,
      entryPrice: signalData.entryPrice,
      stopLoss: signalData.stopLoss,
      target: signalData.target,
      riskReward: signalData.riskReward,
      reasons: signalData.reasons,
      recommendation: signalData.recommendation,
      timeframe: '1-3 days',
      technicals: {
        price: marketData.currentPrice,
        dma50: ma50,
        rsi14: rsi,
        macdSignal: macd.line > macd.signal ? 'BULLISH' : macd.line < macd.signal ? 'BEARISH' : 'NEUTRAL',
        volumeVsAvg: volumeRatio,
        atr14: atr
      },
      positionSizing,
      chartData: marketData.historicalData.slice(-90).map(d => ({
        date: d.date,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
        volume: d.volume
      })),
      supportResistance: {
        support: [marketData.currentPrice * 0.95, marketData.currentPrice * 0.92],
        resistance: [marketData.currentPrice * 1.05, marketData.currentPrice * 1.08]
      }
    };

    console.log(`Analysis complete for ${symbol}:`, response.signal, response.confidence);

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in analyze-stock function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze stock';
    const errorDetails = error instanceof Error ? error.toString() : String(error);

    return new Response(JSON.stringify({
      error: errorMessage,
      details: errorDetails
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
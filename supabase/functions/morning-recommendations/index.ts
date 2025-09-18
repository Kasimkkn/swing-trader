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
  signal: 'BUY' | 'SELL' | 'HOLD';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  riskReward: string;
  reasons: string[];
  technicals: {
    currentPrice: number;
    dma20: number;
    dma30: number;
    rsi: number;
    volume: number;
    avgVolume: number;
  };
}

async function fetchYahooData(symbol: string) {
  try {
    console.log(`Fetching data for ${symbol}`);
    
    const period1 = Math.floor((Date.now() - 90 * 24 * 60 * 60 * 1000) / 1000);
    const period2 = Math.floor(Date.now() / 1000);
    
    const response = await fetch(
      `https://query1.finance.yahoo.com/v7/finance/download/${symbol}.NS?period1=${period1}&period2=${period2}&interval=1d&events=history&includeAdjustedClose=true`
    );
    
    if (!response.ok) {
      console.log(`Yahoo Finance API error for ${symbol}: ${response.status}`);
      return null;
    }
    
    const csvData = await response.text();
    const lines = csvData.split('\n').slice(1).filter(line => line.trim());
    
    if (lines.length < 30) {
      console.log(`Not enough data for ${symbol}`);
      return null;
    }
    
    const prices: number[] = [];
    const volumes: number[] = [];
    let currentPrice = 0;
    
    lines.forEach(line => {
      const cols = line.split(',');
      if (cols.length >= 6) {
        const close = parseFloat(cols[4]);
        const volume = parseInt(cols[6]);
        if (!isNaN(close) && !isNaN(volume)) {
          prices.push(close);
          volumes.push(volume);
        }
      }
    });
    
    if (prices.length < 30) return null;
    
    currentPrice = prices[prices.length - 1];
    
    // Calculate 20-day and 30-day moving averages
    const dma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const dma30 = prices.slice(-30).reduce((a, b) => a + b, 0) / 30;
    
    // Calculate average volume (last 20 days)
    const avgVolume = volumes.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const currentVolume = volumes[volumes.length - 1];
    
    // Simple RSI calculation (14-day)
    const rsiPeriod = 14;
    if (prices.length < rsiPeriod + 1) return null;
    
    let gains = 0, losses = 0;
    for (let i = prices.length - rsiPeriod; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1];
      if (change > 0) gains += change;
      else losses -= change;
    }
    
    const avgGain = gains / rsiPeriod;
    const avgLoss = losses / rsiPeriod;
    const rs = avgGain / avgLoss;
    const rsi = 100 - (100 / (1 + rs));
    
    return {
      currentPrice,
      dma20,
      dma30,
      avgVolume,
      currentVolume,
      rsi,
      priceHistory: prices,
      volumeHistory: volumes
    };
  } catch (error) {
    console.error(`Error fetching data for ${symbol}:`, error);
    return null;
  }
}

async function analyzeStock(symbol: string, companyName: string): Promise<StockRecommendation | null> {
  const data = await fetchYahooData(symbol);
  if (!data) return null;
  
  const { currentPrice, dma20, dma30, avgVolume, currentVolume, rsi, priceHistory } = data;
  
  // Technical analysis
  const priceAboveDMA20 = currentPrice > dma20;
  const priceAboveDMA30 = currentPrice > dma30;
  const dma20AboveDMA30 = dma20 > dma30;
  const volumeSpike = currentVolume > avgVolume * 1.5;
  const rsiOversold = rsi < 30;
  const rsiOverbought = rsi > 70;
  const rsiNeutral = rsi >= 40 && rsi <= 60;
  
  // Price momentum (last 5 days vs previous 5 days)
  const recent5 = priceHistory.slice(-5);
  const previous5 = priceHistory.slice(-10, -5);
  const recentAvg = recent5.reduce((a, b) => a + b, 0) / 5;
  const previousAvg = previous5.reduce((a, b) => a + b, 0) / 5;
  const momentum = (recentAvg - previousAvg) / previousAvg;
  
  let signal: 'BUY' | 'SELL' | 'HOLD' = 'HOLD';
  let confidence = 50;
  const reasons: string[] = [];
  
  // Bullish signals
  if (priceAboveDMA20 && priceAboveDMA30 && dma20AboveDMA30) {
    signal = 'BUY';
    confidence += 20;
    reasons.push('Price above both DMAs with bullish crossover');
  }
  
  if (volumeSpike && momentum > 0.02) {
    signal = 'BUY';
    confidence += 15;
    reasons.push('Volume spike with positive momentum');
  }
  
  if (rsiOversold && momentum > -0.01) {
    signal = 'BUY';
    confidence += 10;
    reasons.push('RSI oversold with stabilizing momentum');
  }
  
  // Bearish signals
  if (!priceAboveDMA20 && !priceAboveDMA30 && momentum < -0.03) {
    signal = 'SELL';
    confidence = 75;
    reasons.push('Price below DMAs with negative momentum');
  }
  
  if (rsiOverbought && momentum < -0.01) {
    signal = 'SELL';
    confidence = 70;
    reasons.push('RSI overbought with declining momentum');
  }
  
  // Neutral/Hold conditions
  if (rsiNeutral && Math.abs(momentum) < 0.015) {
    signal = 'HOLD';
    confidence = 60;
    reasons.push('Neutral technical indicators');
  }
  
  // Ensure minimum reasons
  if (reasons.length === 0) {
    reasons.push('Mixed technical signals');
  }
  
  // Calculate entry, target, and stop loss
  let entryPrice = currentPrice;
  let targetPrice = currentPrice;
  let stopLoss = currentPrice;
  
  if (signal === 'BUY') {
    entryPrice = Math.round(currentPrice * 0.998 * 100) / 100; // Slightly below current
    targetPrice = Math.round(currentPrice * 1.06 * 100) / 100; // 6% target
    stopLoss = Math.round(currentPrice * 0.97 * 100) / 100; // 3% stop loss
  } else if (signal === 'SELL') {
    entryPrice = currentPrice;
    targetPrice = Math.round(currentPrice * 0.94 * 100) / 100; // 6% down target
    stopLoss = Math.round(currentPrice * 1.03 * 100) / 100; // 3% stop loss
  } else {
    entryPrice = currentPrice;
    targetPrice = currentPrice;
    stopLoss = Math.round(currentPrice * 0.95 * 100) / 100;
  }
  
  const riskReward = signal === 'HOLD' ? '1:1' : '1:2';
  
  return {
    symbol,
    companyName,
    signal,
    confidence: Math.min(confidence, 95),
    entryPrice,
    targetPrice,
    stopLoss,
    riskReward,
    reasons,
    technicals: {
      currentPrice,
      dma20,
      dma30,
      rsi,
      volume: currentVolume,
      avgVolume
    }
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting morning recommendations generation...');
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get all stocks from the master stocks table
    const { data: stocks, error: stocksError } = await supabase
      .from('stocks')
      .select('id, symbol, company_name')
      .limit(50);
    
    if (stocksError) {
      console.error('Error fetching stocks:', stocksError);
      return new Response(JSON.stringify({ error: 'Failed to fetch stocks' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    
    console.log(`Analyzing ${stocks.length} stocks...`);
    
    // Analyze stocks in parallel
    const analysisPromises = stocks.map(stock => 
      analyzeStock(stock.symbol, stock.company_name)
    );
    
    const results = await Promise.all(analysisPromises);
    const validRecommendations = results.filter((rec): rec is StockRecommendation => rec !== null);
    
    console.log(`Generated ${validRecommendations.length} valid recommendations`);
    
    // Store/update recommendations in the database
    const today = new Date().toISOString().split('T')[0];
    
    for (const rec of validRecommendations) {
      // Find the stock ID
      const stock = stocks.find(s => s.symbol === rec.symbol);
      if (!stock) continue;
      
      // Upsert recommendation (update if exists for today, insert if not)
      const { error: upsertError } = await supabase
        .from('ai_recommendations')
        .upsert({
          stock_id: stock.id,
          signal: rec.signal,
          confidence: rec.confidence,
          target_price: rec.targetPrice,
          stop_loss: rec.stopLoss,
          entry_price: rec.entryPrice,
          ema9: null, // Not calculated in this version
          ema20: rec.technicals.dma20,
          rsi: rec.technicals.rsi,
          reasons: rec.reasons,
          recommendation_date: today
        }, {
          onConflict: 'stock_id,recommendation_date'
        });
      
      if (upsertError) {
        console.error(`Error upserting recommendation for ${rec.symbol}:`, upsertError);
      }
    }
    
    // Sort by confidence and return top recommendations
    const topRecommendations = validRecommendations
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10);
    
    console.log('Morning recommendations generated successfully');
    
    return new Response(JSON.stringify({
      success: true,
      recommendations: topRecommendations,
      generatedAt: new Date().toISOString(),
      totalAnalyzed: stocks.length,
      validRecommendations: validRecommendations.length
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
    
  } catch (error) {
    console.error('Error in morning-recommendations function:', error);
    return new Response(JSON.stringify({ 
      error: 'Failed to generate recommendations',
      details: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
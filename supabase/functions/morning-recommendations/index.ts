import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StockRecommendation {
  symbol: string;
  companyName: string;
  signal: 'BUY' | 'HOLD' | 'SELL';
  buyingPrice: number;
  sellingPrice: number;
  stopLoss: number;
  timeframe: '2-3 days';
  confidence: number;
  reasons: string[];
  sectorTrend: string;
  dma20: number;
  dma30: number;
  volume: number;
  marketCap: number;
}

async function fetchYahooData(symbol: string) {
  try {
    const response = await fetch(
      `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}.NS`
    );
    const data = await response.json();
    
    if (!data.chart?.result?.[0]) {
      throw new Error('No data found');
    }

    const result = data.chart.result[0];
    const quotes = result.indicators.quote[0];
    const timestamps = result.timestamp;
    
    // Get last 30 days of data for DMA calculation
    const prices = quotes.close.slice(-30);
    const volumes = quotes.volume.slice(-30);
    const currentPrice = prices[prices.length - 1];
    
    // Calculate DMAs
    const dma20 = prices.slice(-20).reduce((a, b) => a + b, 0) / 20;
    const dma30 = prices.reduce((a, b) => a + b, 0) / 30;
    
    // Calculate average volume
    const avgVolume = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    
    return {
      currentPrice,
      dma20,
      dma30,
      avgVolume,
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

  const { currentPrice, dma20, dma30, avgVolume, priceHistory } = data;
  
  // Technical analysis
  const priceAboveDMA20 = currentPrice > dma20;
  const priceAboveDMA30 = currentPrice > dma30;
  const dma20AboveDMA30 = dma20 > dma30;
  
  // Price momentum (last 5 days)
  const recentPrices = priceHistory.slice(-5);
  const momentum = (recentPrices[recentPrices.length - 1] - recentPrices[0]) / recentPrices[0] * 100;
  
  // Volume analysis
  const volumeSpike = data.volumeHistory[data.volumeHistory.length - 1] > avgVolume * 1.2;
  
  // Generate signal
  let signal: 'BUY' | 'HOLD' | 'SELL' = 'HOLD';
  let confidence = 50;
  let reasons: string[] = [];
  
  if (priceAboveDMA20 && priceAboveDMA30 && dma20AboveDMA30 && momentum > 2) {
    signal = 'BUY';
    confidence = 75;
    reasons.push('Price above both 20 & 30 DMA');
    reasons.push('Positive momentum');
    if (volumeSpike) {
      reasons.push('Volume spike detected');
      confidence += 10;
    }
  } else if (!priceAboveDMA20 && momentum < -3) {
    signal = 'SELL';
    confidence = 70;
    reasons.push('Price below 20 DMA');
    reasons.push('Negative momentum');
  }
  
  // Calculate targets
  const buyingPrice = currentPrice;
  const sellingPrice = currentPrice * 1.08; // 8% target
  const stopLoss = currentPrice * 0.94; // 6% stop loss

  return {
    symbol,
    companyName,
    signal,
    buyingPrice: Math.round(buyingPrice * 100) / 100,
    sellingPrice: Math.round(sellingPrice * 100) / 100,
    stopLoss: Math.round(stopLoss * 100) / 100,
    timeframe: '2-3 days',
    confidence,
    reasons,
    sectorTrend: 'NEUTRAL', // Simplified for now
    dma20: Math.round(dma20 * 100) / 100,
    dma30: Math.round(dma30 * 100) / 100,
    volume: avgVolume,
    marketCap: 0 // Will be fetched separately if needed
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Generating morning stock recommendations...');
    
    // Top Indian stocks for analysis
    const stockList = [
      { symbol: 'RELIANCE', name: 'Reliance Industries Ltd' },
      { symbol: 'TCS', name: 'Tata Consultancy Services' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd' },
      { symbol: 'INFY', name: 'Infosys Ltd' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank' },
      { symbol: 'HINDUNILVR', name: 'Hindustan Unilever Ltd' },
      { symbol: 'ITC', name: 'ITC Ltd' },
      { symbol: 'LT', name: 'Larsen & Toubro Ltd' },
      { symbol: 'SBIN', name: 'State Bank of India' },
      { symbol: 'BAJFINANCE', name: 'Bajaj Finance Ltd' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Ltd' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Ltd' },
      { symbol: 'WIPRO', name: 'Wipro Ltd' }
    ];

    // Analyze stocks in parallel
    const analysisPromises = stockList.map(stock => 
      analyzeStock(stock.symbol, stock.name)
    );
    
    const results = await Promise.all(analysisPromises);
    
    // Filter out null results and sort by confidence
    const recommendations = results
      .filter(result => result !== null)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 10); // Top 10 recommendations

    console.log(`Generated ${recommendations.length} recommendations`);

    return new Response(
      JSON.stringify({
        success: true,
        recommendations,
        generatedAt: new Date().toISOString(),
        totalAnalyzed: stockList.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error generating recommendations:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Failed to generate recommendations'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
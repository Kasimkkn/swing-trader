export type SignalType = 'BUY' | 'SELL' | 'HOLD';

// Master Stocks table
export interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  current_price?: number;
  industry_category?: string;
  created_at: string;
  updated_at: string;
}

// AI Recommendations table
export interface AIRecommendation {
  id: string;
  stock_id: string;
  signal: SignalType;
  confidence: number;
  target_price?: number;
  stop_loss?: number;
  entry_price?: number;
  ema9?: number;
  ema20?: number;
  rsi?: number;
  reasons?: string[];
  recommendation_date: string;
  created_at: string;
  updated_at: string;
  stock?: Stock; // Join with stocks table
}

// Search/Analysis table
export interface SearchAnalysis {
  id: string;
  stock_id: string;
  analysis_type: string;
  technical_data?: any;
  fundamental_data?: any;
  search_query?: string;
  results?: any;
  created_at: string;
  updated_at: string;
  stock?: Stock; // Join with stocks table
}

// Portfolio table
export interface Portfolio {
  id: string;
  stock_id: string;
  quantity: number;
  buying_price: number;
  selling_price?: number;
  status: 'hold' | 'sold';
  buy_date: string;
  sell_date?: string;
  created_at: string;
  updated_at: string;
  stock?: Stock; // Join with stocks table
}

// Wishlist table
export interface Wishlist {
  id: string;
  stock_id: string;
  created_at: string;
  updated_at: string;
  stock?: Stock; // Join with stocks table
}

// Legacy interfaces for backward compatibility
export interface StockAnalysis {
  symbol: string;
  companyName: string;
  signal: SignalType;
  confidence: number;
  currentPrice: number;
  entryPrice: number;
  stopLoss: number;
  target: number;
  riskReward: string;
  reasons: string[];
  technicals: TechnicalIndicators;
  positionSizing: PositionSizing;
  chartData: ChartData[];
  supportResistance: {
    support: number[];
    resistance: number[];
  };
}

export interface TechnicalIndicators {
  price: number;
  dma50: number;
  rsi14: number;
  macdSignal: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  volumeVsAvg: number;
  atr14: number;
}

export interface PositionSizing {
  portfolioValue: number;
  recommendedShares: number;
  exposure: number;
  maxRisk: number;
}

export interface ChartData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface StockResearch {
  symbol: string;
  companyName: string;
  businessModel: {
    sector: string;
    industry: string;
    marketCap: number;
    description: string;
  };
  financialHealth: {
    revenueGrowth: number;
    profitMargin: number;
    debtToEquity: number;
    currentRatio: number;
    roe: number;
    lastQuarterGrowth: number;
  };
  sectorAnalysis: {
    sectorTrend: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
    sectorPerformance: number;
    peerComparison: Array<{
      symbol: string;
      name: string;
      performance: number;
    }>;
  };
  marketSentiment: {
    niftyTrend: 'UPTREND' | 'DOWNTREND' | 'SIDEWAYS';
    vix: number;
    fiiDii: {
      fiiFlow: number;
      diiFlow: number;
    };
    globalCues: {
      dowFutures: number;
      crudePrice: number;
      usdInr: number;
    };
  };
  newsEvents: {
    upcomingEvents: Array<{
      type: string;
      date: string;
      description: string;
    }>;
    recentNews: Array<{
      title: string;
      summary: string;
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      source: string;
      date: string;
    }>;
    corporateActions: Array<{
      type: string;
      date: string;
      details: string;
    }>;
  };
  recommendation: {
    overallRating: 'STRONG_BUY' | 'BUY' | 'HOLD' | 'SELL' | 'STRONG_SELL';
    confidence: number;
    timeframe: string;
    keyFactors: string[];
    risks: string[];
  };
}

// Legacy interfaces (keeping for backward compatibility)
export interface Stocks {
  id: string;
  symbol: string;
  companyName: string;
  industry?: string;
}

export interface PortfolioStocks extends Stocks {
  quantity: number;
  buyingPrice: number;
  sellingPrice?: number;
  status: 'hold' | 'sold';
  buyDate: string;
  sellDate?: string;
}

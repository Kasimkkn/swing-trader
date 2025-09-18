export type SignalType = 'BUY' | 'AVOID';

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

export interface Stocks {
  id: string;
  symbol: string;
  companyName: string;
  indusrtry?: string;
}

export interface PortfolioStocks extends Stocks {
  quantity: number;
  buyingPrice: number;
  sellingPrice?: number;
  status: 'hold' | 'sold';
  buyDate: string;
  sellDate?: string;
}

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
import { StockAnalysis } from '@/types/stock';

const generateChartData = (basePrice: number, days: number = 90): StockAnalysis['chartData'] => {
  const data: StockAnalysis['chartData'] = [];
  let currentPrice = basePrice;
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - i));
    
    const volatility = 0.02;
    const change = (Math.random() - 0.5) * volatility;
    currentPrice *= (1 + change);
    
    const open = currentPrice;
    const high = open * (1 + Math.random() * 0.015);
    const low = open * (1 - Math.random() * 0.015);
    const close = low + (high - low) * Math.random();
    const volume = Math.floor(Math.random() * 1000000) + 100000;
    
    data.push({
      date: date.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });
  }
  
  return data;
};

export const mockAnalyses: Record<string, StockAnalysis> = {
  'RELIANCE': {
    symbol: 'RELIANCE',
    companyName: 'Reliance Industries Ltd.',
    signal: 'BUY',
    confidence: 85,
    currentPrice: 2448,
    entryPrice: 2450,
    stopLoss: 2380,
    target: 2590,
    riskReward: '1:2',
    reasons: ['Breakout + Volume', 'Strong Fundamentals', 'Sector Leader'],
    technicals: {
      price: 2448,
      dma50: 2420,
      rsi14: 65,
      macdSignal: 'BULLISH',
      volumeVsAvg: 1.4,
      atr14: 45
    },
    positionSizing: {
      portfolioValue: 100000,
      recommendedShares: 40,
      exposure: 98000,
      maxRisk: 2800
    },
    chartData: generateChartData(2448),
    supportResistance: {
      support: [2380, 2320],
      resistance: [2500, 2590]
    }
  },
  'TCS': {
    symbol: 'TCS',
    companyName: 'Tata Consultancy Services',
    signal: 'BUY',
    confidence: 78,
    currentPrice: 3890,
    entryPrice: 3900,
    stopLoss: 3820,
    target: 4060,
    riskReward: '1:2',
    reasons: ['IT Recovery', 'Strong Q3 Results', 'Dollar Tailwind'],
    technicals: {
      price: 3890,
      dma50: 3845,
      rsi14: 58,
      macdSignal: 'BULLISH',
      volumeVsAvg: 1.2,
      atr14: 78
    },
    positionSizing: {
      portfolioValue: 100000,
      recommendedShares: 25,
      exposure: 97500,
      maxRisk: 2000
    },
    chartData: generateChartData(3890),
    supportResistance: {
      support: [3820, 3750],
      resistance: [3950, 4060]
    }
  },
  'LODHA': {
    symbol: 'LODHA',
    companyName: 'Macrotech Developers Ltd.',
    signal: 'BUY',
    confidence: 72,
    currentPrice: 1110,
    entryPrice: 1115,
    stopLoss: 1090,
    target: 1165,
    riskReward: '1:2',
    reasons: ['Mid-cap Breakout', 'Real Estate Recovery', 'Volume Surge'],
    technicals: {
      price: 1110,
      dma50: 1085,
      rsi14: 62,
      macdSignal: 'BULLISH',
      volumeVsAvg: 2.1,
      atr14: 28
    },
    positionSizing: {
      portfolioValue: 100000,
      recommendedShares: 89,
      exposure: 99235,
      maxRisk: 2225
    },
    chartData: generateChartData(1110),
    supportResistance: {
      support: [1090, 1065],
      resistance: [1140, 1165]
    }
  },
  'SUZLON': {
    symbol: 'SUZLON',
    companyName: 'Suzlon Energy Ltd.',
    signal: 'SELL',
    confidence: 82,
    currentPrice: 58,
    entryPrice: 0,
    stopLoss: 0,
    target: 0,
    riskReward: 'N/A',
    reasons: ['High Debt Levels', 'Weak Fundamentals', 'Sector Headwinds'],
    technicals: {
      price: 58,
      dma50: 62,
      rsi14: 35,
      macdSignal: 'BEARISH',
      volumeVsAvg: 0.8,
      atr14: 3.2
    },
    positionSizing: {
      portfolioValue: 100000,
      recommendedShares: 0,
      exposure: 0,
      maxRisk: 0
    },
    chartData: generateChartData(58),
    supportResistance: {
      support: [52, 48],
      resistance: [62, 68]
    }
  },
  'ZOMATO': {
    symbol: 'ZOMATO',
    companyName: 'Zomato Ltd.',
    signal: 'SELL',
    confidence: 76,
    currentPrice: 125,
    entryPrice: 0,
    stopLoss: 0,
    target: 0,
    riskReward: 'N/A',
    reasons: ['Bearish Technicals', 'High Valuation', 'Profit Concerns'],
    technicals: {
      price: 125,
      dma50: 135,
      rsi14: 42,
      macdSignal: 'BEARISH',
      volumeVsAvg: 1.1,
      atr14: 8.5
    },
    positionSizing: {
      portfolioValue: 100000,
      recommendedShares: 0,
      exposure: 0,
      maxRisk: 0
    },
    chartData: generateChartData(125),
    supportResistance: {
      support: [118, 110],
      resistance: [135, 145]
    }
  }
};

export const getStockAnalysis = async (symbol: string): Promise<StockAnalysis | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1200));
  
  const normalizedSymbol = symbol.toUpperCase().replace('NSE:', '');
  return mockAnalyses[normalizedSymbol] || null;
};
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TechnicalIndicators } from '@/types/stock';

interface TechnicalPanelProps {
  technicals: TechnicalIndicators;
}

const TechnicalPanel = ({ technicals }: TechnicalPanelProps) => {
  const getMacdColor = (signal: string) => {
    switch (signal) {
      case 'BULLISH': return 'text-signal-buy';
      case 'BEARISH': return 'text-signal-avoid';
      default: return 'text-muted-foreground';
    }
  };

  const getVolumeColor = (ratio: number) => {
    if (ratio > 1.2) return 'text-signal-buy';
    if (ratio < 0.8) return 'text-signal-avoid';
    return 'text-muted-foreground';
  };

  const getRsiColor = (rsi: number) => {
    if (rsi > 70) return 'text-signal-avoid';
    if (rsi < 30) return 'text-signal-buy';
    return 'text-muted-foreground';
  };

  return (
    <Card className="p-4 bg-card border-border">
      <h3 className="text-lg font-semibold text-foreground mb-4">Technical Indicators</h3>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Current Price</span>
            <span className="font-mono font-semibold text-foreground">
              ₹{technicals.price.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">50 DMA</span>
            <span className={`font-mono font-semibold ${
              technicals.price > technicals.dma50 ? 'text-signal-buy' : 'text-signal-avoid'
            }`}>
              ₹{technicals.dma50.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">RSI (14)</span>
            <span className={`font-mono font-semibold ${getRsiColor(technicals.rsi14)}`}>
              {technicals.rsi14}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">MACD Signal</span>
            <Badge 
              variant="outline" 
              className={`font-mono text-xs ${getMacdColor(technicals.macdSignal)}`}
            >
              {technicals.macdSignal}
            </Badge>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Volume vs Avg</span>
            <span className={`font-mono font-semibold ${getVolumeColor(technicals.volumeVsAvg)}`}>
              {technicals.volumeVsAvg.toFixed(1)}x
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">ATR (14)</span>
            <span className="font-mono font-semibold text-muted-foreground">
              {technicals.atr14.toFixed(1)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default TechnicalPanel;
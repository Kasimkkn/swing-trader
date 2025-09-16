import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { StockAnalysis } from '@/types/stock';

interface SignalCardProps {
  analysis: StockAnalysis;
}

const SignalCard = ({ analysis }: SignalCardProps) => {
  const isBuySignal = analysis.signal === 'BUY';

  return (
    <Card className="p-6 bg-white/5 border-white/10">
      <div className="space-y-6">
        {/* Header with Signal and Company */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <Badge
                variant={isBuySignal ? "default" : "destructive"}
                className={`text-base font-bold px-4 py-0 ${isBuySignal
                  ? 'bg-signal-buy text-signal-buy-foreground'
                  : 'bg-signal-avoid text-signal-avoid-foreground'
                  }`}
              >
                {analysis.signal}
              </Badge>
              <span className="font-mono text-lg font-semibold text-foreground">
                {analysis.symbol}
              </span>
            </div>
            <p className="text-muted-foreground">{analysis.companyName}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Current Price</p>
            <p className="font-mono text-2xl font-bold text-foreground">
              ₹{analysis.currentPrice.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-foreground">Confidence</span>
            <span className="font-mono text-sm font-semibold text-foreground">
              {analysis.confidence}/100
            </span>
          </div>
          <Progress
            value={analysis.confidence}
            className="h-2 bg-muted"
          />
        </div>

        {/* Key Levels - Only show for BUY signals */}
        {isBuySignal && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-accent/30 rounded border border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Entry</p>
              <p className="font-mono font-semibold text-text-white">
                ₹{analysis.entryPrice.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Stop Loss</p>
              <p className="font-mono font-semibold text-signal-avoid">
                ₹{analysis.stopLoss.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Target</p>
              <p className="font-mono font-semibold text-signal-buy">
                ₹{analysis.target.toLocaleString()}
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground mb-1">Risk/Reward</p>
              <p className="font-mono font-semibold text-foreground">
                {analysis.riskReward}
              </p>
            </div>
          </div>
        )}

        {/* Reason Tags */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Analysis Factors</p>
          <div className="flex flex-wrap gap-2">
            {analysis.reasons.map((reason, index) => (
              <Badge
                key={index}
                variant="outline"
                className={`text-xs ${isBuySignal
                  ? 'border-signal-buy-muted text-signal-buy bg-signal-buy-muted/20'
                  : 'border-signal-avoid-muted text-signal-avoid bg-signal-avoid-muted/20'
                  }`}
              >
                {reason}
              </Badge>
            ))}
          </div>
        </div>

        {/* Position Sizing - Only show for BUY signals */}
        {isBuySignal && (
          <div className="p-4 bg-muted/30 rounded border border-border">
            <p className="text-sm font-medium text-foreground mb-2">
              Position Sizing (₹1L Portfolio)
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-muted-foreground">Shares: </span>
                <span className="font-mono font-semibold text-foreground">
                  {analysis.positionSizing.recommendedShares}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Exposure: </span>
                <span className="font-mono font-semibold text-foreground">
                  ₹{analysis.positionSizing.exposure.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-muted-foreground">Max Risk: </span>
                <span className="font-mono font-semibold text-signal-avoid">
                  ₹{analysis.positionSizing.maxRisk.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default SignalCard;
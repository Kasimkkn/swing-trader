import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Card } from '@/components/ui/card';
import { StockAnalysis } from '@/types/stock';

interface SimpleChartProps {
  analysis: StockAnalysis;
}

const SimpleChart = ({ analysis }: SimpleChartProps) => {
  const chartData = analysis.chartData.map(item => ({
    date: item.date,
    price: item.close,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    })
  }));

  const isBuySignal = analysis.signal === 'BUY';

  return (
    <Card className="p-4 bg-white/5 border-white/10">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">3-Month Price Chart</h3>
        <div className="text-sm text-muted-foreground">
          {analysis.symbol} - Daily Close
        </div>
      </div>

      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <XAxis
              dataKey="displayDate"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['dataMin - 20', 'dataMax + 20']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
              tickFormatter={(value) => `₹${value}`}
            />

            {/* Support Lines */}
            {analysis.supportResistance.support.map((level, index) => (
              <ReferenceLine
                key={`support-${index}`}
                y={level}
                stroke="hsl(var(--signal-buy))"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            ))}

            {/* Resistance Lines */}
            {analysis.supportResistance.resistance.map((level, index) => (
              <ReferenceLine
                key={`resistance-${index}`}
                y={level}
                stroke="hsl(var(--signal-avoid))"
                strokeDasharray="3 3"
                strokeOpacity={0.6}
              />
            ))}

            {/* Entry, Stop, Target Lines for BUY signals */}
            {isBuySignal && (
              <>
                <ReferenceLine
                  y={analysis.entryPrice}
                  stroke="hsl(var(--text-white))"
                  strokeWidth={2}
                />
                <ReferenceLine
                  y={analysis.stopLoss}
                  stroke="hsl(var(--signal-avoid))"
                  strokeWidth={2}
                />
                <ReferenceLine
                  y={analysis.target}
                  stroke="hsl(var(--signal-buy))"
                  strokeWidth={2}
                />
              </>
            )}

            <Line
              type="monotone"
              dataKey="price"
              stroke="hsl(var(--foreground))"
              strokeWidth={2}
              dot={false}
              activeDot={{
                r: 4,
                fill: 'hsl(var(--text-white))',
                stroke: 'hsl(var(--background))',
                strokeWidth: 2
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mt-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-signal-buy"></div>
          <span className="text-muted-foreground">Support</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-0.5 bg-signal-avoid"></div>
          <span className="text-muted-foreground">Resistance</span>
        </div>
        {isBuySignal && (
          <>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-text-white"></div>
              <span className="text-muted-foreground">Entry</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-signal-avoid"></div>
              <span className="text-muted-foreground">Stop Loss</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-0.5 bg-signal-buy"></div>
              <span className="text-muted-foreground">Target</span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default SimpleChart;
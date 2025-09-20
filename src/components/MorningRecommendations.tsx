import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { RefreshCw, Sunrise, TrendingUp, Target, Shield, Clock } from 'lucide-react';

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

interface RecommendationsData {
  success: boolean;
  recommendations: StockRecommendation[];
  generatedAt: string;
  totalAnalyzed: number;
}

const MorningRecommendations = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching morning recommendations...');

      const { data, error } = await supabase.functions.invoke('morning-recommendations');

      if (error) {
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      const result = data as RecommendationsData;

      if (result.success) {
        setRecommendations(result.recommendations);
        setLastUpdated(result.generatedAt);
        toast({
          title: "Recommendations Updated",
          description: `Found ${result.recommendations.length} stock opportunities`,
        });
      } else {
        throw new Error('Failed to generate recommendations');
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to fetch recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-fetch on component mount
  useEffect(() => {
    fetchRecommendations();
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-signal-buy text-signal-buy-foreground';
      case 'SELL': return 'bg-signal-avoid text-signal-avoid-foreground';
      case 'HOLD': return 'bg-signal-hold text-signal-hold-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex max-md:flex-col gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-3">
          <Sunrise className="h-6 w-6" />
          <div>
            <h2 className="text-lg md:text-2xl font-bold">Morning Stock Picks</h2>
            <p className="text-muted-foreground text-xs md:text-sm">
              AI-powered daily recommendations for 2-3 day trades
            </p>
          </div>
        </div>
        <Button
          onClick={fetchRecommendations}
          disabled={isLoading}
          variant="outline"
          size="sm"
          className="border-border"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          <span className="ml-2">Refresh</span>
        </Button>
      </div>

      {/* Last Updated */}
      {lastUpdated && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </div>
      )}

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {recommendations.map((stock, index) => (
          <Card key={`${stock.symbol}-${index}`} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
                  <p className="text-sm text-muted-foreground truncate">
                    {stock.companyName}
                  </p>
                </div>
                <Badge className={getSignalColor(stock.signal)}>
                  {stock.signal}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className="text-lg font-bold">{stock.confidence}%</p>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Price Targets */}
              <div className="grid grid-cols-3 gap-3 text-xs">
                <div className="text-center p-2 bg-muted rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <TrendingUp className="h-3 w-3" />
                    <span className="text-muted-foreground">Entry</span>
                  </div>
                   <p className="font-bold">₹{stock.entryPrice}</p>
                 </div>
                 <div className="text-center p-2 bg-signal-buy-muted rounded">
                   <div className="flex items-center justify-center gap-1 mb-1">
                     <Target className="h-3 w-3" />
                     <span className="text-muted-foreground">Target</span>
                   </div>
                   <p className="font-bold">₹{stock.targetPrice}</p>
                </div>
                <div className="text-center p-2 bg-signal-avoid-muted rounded">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Shield className="h-3 w-3" />
                    <span className="text-muted-foreground">Stop Loss</span>
                  </div>
                  <p className="font-bold">₹{stock.stopLoss}</p>
                </div>
              </div>

              {/* Technical Levels */}
              {stock.technicals && (
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground">20 DMA</p>
                    <p className="font-medium">₹{stock.technicals.dma20?.toFixed(2) || 'N/A'}</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground">30 DMA</p>
                    <p className="font-medium">₹{stock.technicals.dma30?.toFixed(2) || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Reasons */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-2">Key Factors:</p>
                <div className="space-y-1">
                  {stock.reasons.slice(0, 2).map((reason, idx) => (
                    <p key={idx} className="text-xs text-foreground bg-muted px-2 py-1 rounded">
                      • {reason}
                    </p>
                  ))}
                </div>
              </div>

               {/* Risk Reward */}
               <div className="text-center pt-2 border-t border-border">
                 <p className="text-xs text-muted-foreground">
                   Risk:Reward: <span className="font-medium">{stock.riskReward}</span>
                 </p>
               </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {recommendations.length === 0 && !isLoading && (
        <Card className="bg-card border-border">
          <CardContent className="text-center py-12">
            <Sunrise className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Recommendations Yet</p>
            <p className="text-muted-foreground mb-4">
              Click refresh to generate today's stock picks
            </p>
            <Button onClick={fetchRecommendations} disabled={isLoading}>
              Generate Recommendations
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MorningRecommendations;
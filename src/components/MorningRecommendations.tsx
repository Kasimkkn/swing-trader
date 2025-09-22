import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  AlertCircle,
  BarChart3,
  ChevronDown,
  ChevronUp,
  Filter,
  RefreshCw,
  Shield,
  Sunrise,
  Target,
  TrendingUp,
  Volume2,
  Zap
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface StockRecommendation {
  symbol: string;
  companyName: string;
  signal: 'BUY' | 'SELL' | 'HOLD' | 'NEUTRAL';
  confidence: number;
  entryPrice: number;
  targetPrice: number;
  stopLoss: number;
  trailingStop?: number;
  positionSize?: number;
  riskReward: string;
  reasons: string[];
  isHalal?: boolean;
  sector?: string;
  technicals: {
    currentPrice: number;
    ema20: number;
    ema50: number;
    rsi: number;
    atr?: number;
    supertrend?: number;
    supertrendSignal?: 'BUY' | 'SELL';
    macd?: number;
    macdSignal?: number;
    bbUpper?: number;
    bbLower?: number;
    volume: number;
    avgVolume: number;
    volatility?: number;
  };
}

interface RecommendationsResponse {
  success: boolean;
  summary: {
    totalAnalyzed: number;
    validRecommendations: number;
    diversifiedRecommendations: number;
    buySignals: number;
    sellSignals: number;
    halalRecommendations: number;
  };
  topPicks: StockRecommendation[];
  allRecommendations: StockRecommendation[];
  generatedAt: string;
  features: string[];
}

const MorningRecommendations = () => {
  const [recommendations, setRecommendations] = useState<StockRecommendation[]>([]);
  const [topPicks, setTopPicks] = useState<StockRecommendation[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedSignal, setSelectedSignal] = useState<string>('all');
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching enhanced morning recommendations...');

      const { data, error } = await supabase.functions.invoke('morning-recommendations');

      if (error) {
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      const result = data as RecommendationsResponse;

      console.log("result", result)
      if (result.success) {
        setRecommendations(result.allRecommendations || []);
        setTopPicks(result.topPicks || []);
        setSummary(result.summary || {});
        setFeatures(result.features || []);
        setLastUpdated(result.generatedAt);
        setHasInitialLoad(true);

        // Save to localStorage with timestamp check
        localStorage.setItem('morning-recommendations-enhanced', JSON.stringify(result));
        localStorage.setItem('morning-recommendations-time-enhanced', result.generatedAt);

        toast({
          title: "🚀 Recommendations Updated",
          description: `Found ${result.allRecommendations.length} opportunities with ${result.summary.halalRecommendations} Halal stocks`,
        });
      } else {
        throw new Error('Failed to generate recommendations');
      }
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      toast({
        title: "⚠️ Error",
        description: error.message || "Failed to fetch recommendations",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Load cached data on component mount
  useEffect(() => {
    const cachedData = localStorage.getItem('morning-recommendations-enhanced');
    const cachedTime = localStorage.getItem('morning-recommendations-time-enhanced');

    if (cachedData && cachedTime) {
      try {
        const parsed = JSON.parse(cachedData);
        setRecommendations(parsed.allRecommendations || []);
        setTopPicks(parsed.topPicks || []);
        setSummary(parsed.summary || {});
        setFeatures(parsed.features || []);
        setLastUpdated(parsed.generatedAt);
        setHasInitialLoad(true);
      } catch (error) {
        console.error('Error parsing cached data:', error);
      }
    }
  }, []);

  const getSignalColor = (signal: string) => {
    switch (signal) {
      case 'BUY': return 'bg-green-500 text-white hover:bg-green-600';
      case 'SELL': return 'bg-red-500 text-white hover:bg-red-600';
      case 'HOLD': return 'bg-yellow-500 text-white hover:bg-yellow-600';
      case 'NEUTRAL': return 'bg-gray-500 text-white hover:bg-gray-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 70) return 'text-blue-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-gray-600';
  };

  const getFilteredRecommendations = () => {
    let filtered = recommendations;

    if (selectedSignal !== 'all') {
      filtered = filtered.filter(stock => stock.signal === selectedSignal);
    }

    return filtered;
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number, decimals: number = 2) => {
    return value.toFixed(decimals);
  };

  const SkeletonCard = () => (
    <Card className="bg-card border border-border hover:shadow-lg transition-all duration-200">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-6 w-20 bg-muted" />
            <Skeleton className="h-4 w-32 bg-muted" />
          </div>
          <Skeleton className="h-6 w-16 bg-muted" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <Skeleton className="h-16 bg-muted" />
          <Skeleton className="h-16 bg-muted" />
          <Skeleton className="h-16 bg-muted" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 bg-muted" />
          <Skeleton className="h-4 bg-muted" />
        </div>
      </CardContent>
    </Card>
  );

  const StockCard = ({ stock, isTopPick = false }: { stock: StockRecommendation; isTopPick?: boolean }) => {
    const isExpanded = expandedCard === `${stock.symbol}-${isTopPick ? 'top' : 'all'}`;
    const cardKey = `${stock.symbol}-${isTopPick ? 'top' : 'all'}`;

    return (
      <Card className={`bg-card border transition-all duration-300 hover:shadow-xl ${isTopPick ? 'ring-2 ring-blue-500 ring-opacity-50' : 'border-border hover:border-primary/50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <CardTitle className="text-lg font-bold truncate">{stock.symbol}</CardTitle>
                {stock.isHalal && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
                    ✅ Halal
                  </Badge>
                )}
                {isTopPick && (
                  <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                    🌟 Top Pick
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground truncate mb-1">
                {stock.companyName}
              </p>
              {stock.sector && (
                <p className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full inline-block">
                  {stock.sector}
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge className={getSignalColor(stock.signal)}>
                {stock.signal}
              </Badge>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Confidence</p>
                <p className={`text-lg font-bold ${getConfidenceColor(stock.confidence)}`}>
                  {stock.confidence}%
                </p>
                <Progress value={stock.confidence} className="w-16 h-1 mt-1" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Price & Key Metrics */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Current Price</span>
              <span className="text-lg font-bold">{formatCurrency(stock.technicals.currentPrice)}</span>
            </div>
            {stock.technicals.volatility && (
              <div className="flex justify-between items-center text-xs text-muted-foreground">
                <span>Volatility</span>
                <span>{formatNumber(stock.technicals.volatility * 100, 1)}%</span>
              </div>
            )}
          </div>

          {/* Price Targets */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
            <div className="text-center p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <TrendingUp className="h-3 w-3 text-blue-600" />
                <span className="text-muted-foreground font-medium">Entry</span>
              </div>
              <p className="font-bold text-blue-600">{formatCurrency(stock.entryPrice)}</p>
            </div>
            <div className="text-center p-3 bg-green-50 dark:bg-green-950/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Target className="h-3 w-3 text-green-600" />
                <span className="text-muted-foreground font-medium">Target</span>
              </div>
              <p className="font-bold text-green-600">{formatCurrency(stock.targetPrice)}</p>
            </div>
            <div className="text-center p-3 bg-red-50 dark:bg-red-950/30 rounded-lg col-span-2 lg:col-span-1">
              <div className="flex items-center justify-center gap-1 mb-2">
                <Shield className="h-3 w-3 text-red-600" />
                <span className="text-muted-foreground font-medium">Stop Loss</span>
              </div>
              <p className="font-bold text-red-600">{formatCurrency(stock.stopLoss)}</p>
            </div>
          </div>

          {/* Technical Indicators Quick View */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-muted-foreground">RSI</p>
              <p className={`font-medium ${stock.technicals.rsi > 70 ? 'text-red-600' : stock.technicals.rsi < 30 ? 'text-green-600' : 'text-blue-600'}`}>
                {formatNumber(stock.technicals.rsi)}
              </p>
            </div>
            <div className="p-2 bg-muted rounded text-center">
              <p className="text-muted-foreground">EMA20</p>
              <p className="font-medium">{formatCurrency(stock.technicals.ema20)}</p>
            </div>
          </div>

          {/* Risk & Position Info */}
          {(stock.positionSize || stock.riskReward) && (
            <div className="grid grid-cols-2 gap-2 text-xs">
              {stock.positionSize && (
                <div className="p-2 bg-blue-50 dark:bg-blue-950/30 rounded text-center">
                  <p className="text-muted-foreground">Position Size</p>
                  <p className="font-medium text-blue-600">{stock.positionSize} shares</p>
                </div>
              )}
              <div className="p-2 bg-purple-50 dark:bg-purple-950/30 rounded text-center">
                <p className="text-muted-foreground">Risk:Reward</p>
                <p className="font-medium text-purple-600">{stock.riskReward}</p>
              </div>
            </div>
          )}

          {/* Key Factors Preview */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">Key Factors:</p>
            <div className="space-y-1">
              {stock.reasons.slice(0, 2).map((reason, idx) => (
                <p key={idx} className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span className="flex-1">{reason}</span>
                </p>
              ))}
              {stock.reasons.length > 2 && !isExpanded && (
                <p className="text-xs text-muted-foreground">
                  +{stock.reasons.length - 2} more factors
                </p>
              )}
            </div>
          </div>

          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
            className="w-full mt-2"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show More Details
              </>
            )}
          </Button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 mt-4 pt-4 border-t border-border">
              {/* All Technical Indicators */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Technical Analysis
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground">EMA50</p>
                    <p className="font-medium">{formatCurrency(stock.technicals.ema50)}</p>
                  </div>
                  {stock.technicals.atr && (
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-muted-foreground">ATR</p>
                      <p className="font-medium">{formatNumber(stock.technicals.atr)}</p>
                    </div>
                  )}
                  {stock.technicals.supertrend && (
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-muted-foreground">SuperTrend</p>
                      <p className={`font-medium ${stock.technicals.supertrendSignal === 'BUY' ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(stock.technicals.supertrend)}
                      </p>
                    </div>
                  )}
                  {stock.technicals.macd && (
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-muted-foreground">MACD</p>
                      <p className={`font-medium ${stock.technicals.macd > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatNumber(stock.technicals.macd, 3)}
                      </p>
                    </div>
                  )}
                  {stock.technicals.bbUpper && (
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-muted-foreground">BB Upper</p>
                      <p className="font-medium">{formatCurrency(stock.technicals.bbUpper)}</p>
                    </div>
                  )}
                  {stock.technicals.bbLower && (
                    <div className="p-2 bg-muted rounded text-center">
                      <p className="text-muted-foreground">BB Lower</p>
                      <p className="font-medium">{formatCurrency(stock.technicals.bbLower)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Volume Analysis */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Volume Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground">Current Volume</p>
                    <p className="font-medium">{(stock.technicals.volume / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-2 bg-muted rounded text-center">
                    <p className="text-muted-foreground">Avg Volume</p>
                    <p className="font-medium">{(stock.technicals.avgVolume / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>

              {/* All Reasons */}
              <div>
                <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Complete Analysis
                </h4>
                <div className="space-y-2">
                  {stock.reasons.map((reason, idx) => (
                    <p key={idx} className="text-xs text-foreground bg-muted px-3 py-2 rounded-lg flex items-start gap-2">
                      <span className="text-primary mt-0.5 font-bold">•</span>
                      <span className="flex-1">{reason}</span>
                    </p>
                  ))}
                </div>
              </div>

              {/* Additional Risk Info */}
              {stock.trailingStop && (
                <div>
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Risk Management
                  </h4>
                  <div className="p-3 bg-orange-50 dark:bg-orange-950/30 rounded-lg">
                    <p className="text-xs text-muted-foreground">Trailing Stop</p>
                    <p className="font-medium text-orange-600">{formatCurrency(stock.trailingStop)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
        <div className="flex items-center gap-3">
          <Sunrise className="h-6 w-6 text-white" />
          <div>
            <h2 className="text-xl lg:text-3xl font-bold text-white">
              Enhanced Stock Picks
            </h2>
            <p className="text-muted-foreground text-sm lg:text-base">
              AI-powered recommendations with advanced technical analysis
            </p>
          </div>
        </div>
        <Button
          onClick={fetchRecommendations}
          disabled={isLoading}
          className=""
          size="default"
        >
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Zap className="h-4 w-4 mr-2" />
          )}
          {isLoading ? 'Analyzing...' : 'Generate Picks'}
        </Button>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="p-4 ">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{summary.buySignals}</p>
              <p className="text-xs text-muted-foreground">Buy Signals</p>
            </div>
          </Card>
          <Card className="p-4 ">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{summary.sellSignals}</p>
              <p className="text-xs text-muted-foreground">Sell Signals</p>
            </div>
          </Card>
          <Card className="p-4 ">
            <div className="text-center">
              <p className="text-2xl font-bold text-emerald-600">{summary.halalRecommendations}</p>
              <p className="text-xs text-muted-foreground">Halal Certified</p>
            </div>
          </Card>
          <Card className="p-4 ">
            <div className="text-center">
              <p className="text-2xl font-bold text-orange-600">{topPicks.length}</p>
              <p className="text-xs text-muted-foreground">Top Picks</p>
            </div>
          </Card>
        </div>
      )}


      {/* Tabs for different views */}
      {hasInitialLoad && !isLoading && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
            <TabsList className="grid w-full lg:w-auto grid-cols-2 lg:grid-cols-auto">
              <TabsTrigger value="top">Top Picks ({topPicks.length})</TabsTrigger>
              <TabsTrigger value="all">All Picks ({recommendations.length})</TabsTrigger>
            </TabsList>

            {activeTab === 'all' && (
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select
                  value={selectedSignal}
                  onChange={(e) => setSelectedSignal(e.target.value)}
                  className="px-3 py-1 bg-background border border-border rounded-md text-sm"
                >
                  <option value="all">All Signals</option>
                  <option value="BUY">Buy Only</option>
                  <option value="SELL">Sell Only</option>
                  <option value="HOLD">Hold Only</option>
                  <option value="NEUTRAL">Neutral Only</option>
                </select>
              </div>
            )}
          </div>

          <TabsContent value="top" className="space-y-4">
            {topPicks.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {topPicks.map((stock) => (
                  <StockCard key={`top-${stock.symbol}`} stock={stock} isTopPick={true} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Sunrise className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No Top Picks Available</p>
                <p className="text-muted-foreground mt-2">
                  Generate recommendations to see top picks
                </p>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {getFilteredRecommendations().length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {getFilteredRecommendations().map((stock) => (
                  <StockCard key={`all-${stock.symbol}`} stock={stock} />
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center">
                <Activity className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium">No Recommendations Found</p>
                <p className="text-muted-foreground mt-2">
                  {selectedSignal !== 'all'
                    ? `No ${selectedSignal} signals found. Try a different filter.`
                    : 'Generate recommendations to see analysis results'
                  }
                </p>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <SkeletonCard key={index} />
          ))}
        </div>
      )}

      {/* Initial State - No data loaded yet */}
      {!hasInitialLoad && !isLoading && (
        <Card className="p-12 text-center">
          <div className="mx-auto mb-6 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-4 rounded-full w-16 h-16 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Ready to Analyze</h3>
          <p className="text-muted-foreground mb-6">
            Generate AI-powered stock recommendations with advanced technical analysis
          </p>
          <Button
            onClick={fetchRecommendations}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
            size="lg"
          >
            <Zap className="h-4 w-4 mr-2" />
            Generate Recommendations
          </Button>
        </Card>
      )}
    </div>
  );
};

export default MorningRecommendations;
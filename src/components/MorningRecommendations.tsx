import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Activity,
  AlertCircle,
  BarChart3,
  Calendar,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Filter,
  LineChart,
  RefreshCw,
  Search,
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
  const [filteredRecommendations, setFilteredRecommendations] = useState<StockRecommendation[]>([]);
  const [topPicks, setTopPicks] = useState<StockRecommendation[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [features, setFeatures] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [hasInitialLoad, setHasInitialLoad] = useState(false);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSignal, setSelectedSignal] = useState<string>('all');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('today');
  const [sortBy, setSortBy] = useState<string>('confidence');
  
  const { toast } = useToast();

  const fetchRecommendations = async () => {
    setIsLoading(true);
    try {
      console.log('Fetching swing-trader recommendations...');

      const { data, error } = await supabase.functions.invoke('morning-recommendations');

      if (error) {
        throw new Error(error.message || 'Failed to fetch recommendations');
      }

      const result = data as RecommendationsResponse;

      if (result.success) {
        setRecommendations(result.allRecommendations || []);
        setTopPicks(result.topPicks || []);
        setSummary(result.summary || {});
        setFeatures(result.features || []);
        setLastUpdated(result.generatedAt);
        setHasInitialLoad(true);

        // Save to localStorage
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

  // Load cached data on mount
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

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...recommendations];

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(stock =>
        stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        stock.sector?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by signal
    if (selectedSignal !== 'all') {
      filtered = filtered.filter(stock => stock.signal === selectedSignal);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'confidence':
          return b.confidence - a.confidence;
        case 'symbol':
          return a.symbol.localeCompare(b.symbol);
        case 'price':
          return b.technicals.currentPrice - a.technicals.currentPrice;
        case 'rsi':
          return b.technicals.rsi - a.technicals.rsi;
        default:
          return 0;
      }
    });

    setFilteredRecommendations(filtered);
  }, [recommendations, searchQuery, selectedSignal, sortBy]);

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
    if (confidence >= 70) return 'text-white';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-gray-600';
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

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
      timeZone: 'Asia/Kolkata'
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Symbol copied to clipboard",
    });
  };

  const exportToCSV = () => {
    const csvData = filteredRecommendations.map(stock => ({
      Symbol: stock.symbol,
      Company: stock.companyName,
      Signal: stock.signal,
      Confidence: stock.confidence,
      CurrentPrice: stock.technicals.currentPrice,
      EntryPrice: stock.entryPrice,
      Target: stock.targetPrice,
      StopLoss: stock.stopLoss,
      RiskReward: stock.riskReward,
      RSI: stock.technicals.rsi,
      Sector: stock.sector || 'N/A',
      Halal: stock.isHalal ? 'Yes' : 'No'
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(',')).join('\n');
    const csv = `${headers}\n${rows}`;

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `recommendations-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();

    toast({
      title: "Export Complete",
      description: "Recommendations exported to CSV",
    });
  };

  const SkeletonCard = () => (
    <Card className="bg-card border border-border">
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
      </CardContent>
    </Card>
  );

  const StockCard = ({ stock, isTopPick = false }: { stock: StockRecommendation; isTopPick?: boolean }) => {
    const isExpanded = expandedCard === `${stock.symbol}-${isTopPick ? 'top' : 'all'}`;
    const cardKey = `${stock.symbol}-${isTopPick ? 'top' : 'all'}`;
    const mainReason = stock.reasons.find(r => !r.includes('✅') && !r.includes('⚠️')) || stock.reasons[0];

    return (
      <Card className={`bg-card border transition-all duration-300 hover:shadow-xl ${isTopPick ? 'ring-2 ring-primary/50' : 'border-border hover:border-primary/50'}`}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <CardTitle className="text-lg font-bold">{stock.symbol}</CardTitle>
                {stock.isHalal && (
                  <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-400">
                    ✅ Halal
                  </Badge>
                )}
                {isTopPick && (
                  <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/30">
                    ⭐ Top Pick
                  </Badge>
                )}
              </div>
              <p className="text-sm text-muted-foreground mb-1 line-clamp-1">
                {stock.companyName}
              </p>
              {stock.sector && (
                <Badge variant="secondary" className="text-xs">
                  {stock.sector}
                </Badge>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <Badge className={getSignalColor(stock.signal)}>
                {stock.signal}
              </Badge>
              <div className="text-right">
                <p className={`text-lg font-bold ${getConfidenceColor(stock.confidence)}`}>
                  {stock.confidence}%
                </p>
                <Progress value={stock.confidence} className="w-16 h-1 mt-1" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Current Price */}
          <div className="bg-muted/50 p-3 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Current Price</span>
              <span className="text-xl font-bold">{formatCurrency(stock.technicals.currentPrice)}</span>
            </div>
          </div>

          {/* Key Reason with Tooltip */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-help">
                  <div className="flex items-start gap-2">
                    <Zap className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <p className="text-sm text-foreground line-clamp-2">{mainReason}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-sm">{mainReason}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Price Targets Grid */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="text-center p-3 bg-blue-950/20 border border-blue-500/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <TrendingUp className="h-3 w-3 text-blue-400" />
                <span className="text-muted-foreground font-medium">Entry</span>
              </div>
              <p className="font-bold text-blue-400">{formatCurrency(stock.entryPrice)}</p>
            </div>
            <div className="text-center p-3 bg-green-950/20 border border-green-500/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-3 w-3 text-green-400" />
                <span className="text-muted-foreground font-medium">Target</span>
              </div>
              <p className="font-bold text-green-400">{formatCurrency(stock.targetPrice)}</p>
            </div>
            <div className="text-center p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Shield className="h-3 w-3 text-red-400" />
                <span className="text-muted-foreground font-medium">Stop</span>
              </div>
              <p className="font-bold text-red-400">{formatCurrency(stock.stopLoss)}</p>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-muted-foreground mb-1">RSI</p>
              <p className={`font-bold ${stock.technicals.rsi > 70 ? 'text-red-500' : stock.technicals.rsi < 30 ? 'text-green-500' : ''}`}>
                {formatNumber(stock.technicals.rsi)}
              </p>
            </div>
            <div className="p-2 bg-muted/50 rounded text-center">
              <p className="text-muted-foreground mb-1">Risk:Reward</p>
              <p className="font-bold text-primary">{stock.riskReward}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => copyToClipboard(stock.symbol)}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(`https://www.tradingview.com/chart/?symbol=NSE:${stock.symbol}`, '_blank')}
            >
              <LineChart className="h-3 w-3 mr-1" />
              Chart
            </Button>
          </div>

          {/* Expand/Collapse */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpandedCard(isExpanded ? null : cardKey)}
            className="w-full"
          >
            {isExpanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Full Analysis
              </>
            )}
          </Button>

          {/* Expanded Details */}
          {isExpanded && (
            <div className="space-y-4 pt-4 border-t border-border">
              {/* All Technical Indicators */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  Technical Indicators
                </h4>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <p className="text-muted-foreground">EMA20</p>
                    <p className="font-medium">{formatCurrency(stock.technicals.ema20)}</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <p className="text-muted-foreground">EMA50</p>
                    <p className="font-medium">{formatCurrency(stock.technicals.ema50)}</p>
                  </div>
                  {stock.technicals.atr && (
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-muted-foreground">ATR</p>
                      <p className="font-medium">{formatNumber(stock.technicals.atr)}</p>
                    </div>
                  )}
                  {stock.technicals.macd && (
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-muted-foreground">MACD</p>
                      <p className={`font-medium ${stock.technicals.macd > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {formatNumber(stock.technicals.macd, 3)}
                      </p>
                    </div>
                  )}
                  {stock.technicals.supertrend && (
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-muted-foreground">SuperTrend</p>
                      <p className={`font-medium ${stock.technicals.supertrendSignal === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                        {stock.technicals.supertrendSignal}
                      </p>
                    </div>
                  )}
                  {stock.technicals.volatility && (
                    <div className="p-2 bg-muted/50 rounded text-center">
                      <p className="text-muted-foreground">Volatility</p>
                      <p className="font-medium">{formatNumber(stock.technicals.volatility * 100, 1)}%</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Volume Analysis */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Volume2 className="h-4 w-4 text-primary" />
                  Volume Analysis
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <p className="text-muted-foreground">Current Volume</p>
                    <p className="font-medium">{(stock.technicals.volume / 1000).toFixed(0)}K</p>
                  </div>
                  <div className="p-2 bg-muted/50 rounded text-center">
                    <p className="text-muted-foreground">Avg Volume</p>
                    <p className="font-medium">{(stock.technicals.avgVolume / 1000).toFixed(0)}K</p>
                  </div>
                </div>
              </div>

              {/* All Reasons */}
              <div>
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-primary" />
                  Analysis Factors
                </h4>
                <div className="space-y-2">
                  {stock.reasons.map((reason, idx) => (
                    <div key={idx} className="text-xs p-2 bg-muted/50 rounded-lg flex items-start gap-2">
                      <span className="text-primary mt-0.5 shrink-0">•</span>
                      <span className="flex-1">{reason}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Position Details */}
              {stock.positionSize && (
                <div>
                  <h4 className="text-sm font-semibold mb-3">Position Details</h4>
                  <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg text-xs">
                    <p className="mb-2"><span className="font-medium">Position Size:</span> {stock.positionSize} shares</p>
                    <p className="text-muted-foreground">
                      Based on 2% portfolio risk with ATR-based stop loss
                    </p>
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Sunrise className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Swing Trader Recommendations</h1>
                <p className="text-sm text-muted-foreground">
                  AI-powered stock analysis for 1-3 day swings
                </p>
              </div>
            </div>
            <Button
              onClick={fetchRecommendations}
              disabled={isLoading}
              className="gap-2"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              {isLoading ? 'Analyzing...' : 'Refresh'}
            </Button>
          </div>

          {lastUpdated && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              Last updated: {formatTimestamp(lastUpdated)}
              <span className="text-xs text-primary ml-2">● Auto-updates every 2 hours</span>
            </div>
          )}
        </div>
      </div>

      {/* Summary Stats */}
      {summary && (
        <div className="border-b border-border bg-muted/30">
          <div className="container mx-auto px-4 py-6">
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">{summary.totalAnalyzed}</p>
                <p className="text-xs text-muted-foreground">Analyzed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-500">{summary.buySignals}</p>
                <p className="text-xs text-muted-foreground">Buy Signals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{summary.sellSignals}</p>
                <p className="text-xs text-muted-foreground">Sell Signals</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold">{summary.validRecommendations}</p>
                <p className="text-xs text-muted-foreground">Valid Picks</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-500">{summary.diversifiedRecommendations}</p>
                <p className="text-xs text-muted-foreground">Diversified</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">{summary.halalRecommendations}</p>
                <p className="text-xs text-muted-foreground">Halal</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by symbol, company, or sector..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Signal Filter */}
            <Select value={selectedSignal} onValueChange={setSelectedSignal}>
              <SelectTrigger className="w-full md:w-[140px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Signal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Signals</SelectItem>
                <SelectItem value="BUY">Buy</SelectItem>
                <SelectItem value="SELL">Sell</SelectItem>
                <SelectItem value="HOLD">Hold</SelectItem>
                <SelectItem value="NEUTRAL">Neutral</SelectItem>
              </SelectContent>
            </Select>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confidence">Confidence</SelectItem>
                <SelectItem value="symbol">Symbol</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rsi">RSI</SelectItem>
              </SelectContent>
            </Select>

            {/* Export */}
            <Button
              variant="outline"
              onClick={exportToCSV}
              disabled={filteredRecommendations.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>

          {/* Results count */}
          <div className="mt-3 text-sm text-muted-foreground">
            Showing {filteredRecommendations.length} of {recommendations.length} recommendations
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : !hasInitialLoad ? (
          <Card className="text-center py-12">
            <CardContent>
              <Sunrise className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Recommendations Yet</h3>
              <p className="text-muted-foreground mb-4">
                Click refresh to generate today's swing-trader recommendations
              </p>
              <Button onClick={fetchRecommendations}>
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-6">
              <TabsTrigger value="all" className="gap-2">
                <Activity className="h-4 w-4" />
                All Picks ({filteredRecommendations.length})
              </TabsTrigger>
              <TabsTrigger value="top" className="gap-2">
                <Zap className="h-4 w-4" />
                Top 5 Picks
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all">
              {filteredRecommendations.length === 0 ? (
                <Card className="text-center py-12">
                  <CardContent>
                    <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      No recommendations match your filters
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredRecommendations.map((stock) => (
                    <StockCard key={stock.symbol} stock={stock} />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="top">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topPicks.map((stock) => (
                  <StockCard key={stock.symbol} stock={stock} isTopPick />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

export default MorningRecommendations;
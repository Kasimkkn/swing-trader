import Header from '@/components/Header';
import MorningRecommendations from '@/components/MorningRecommendations';
import SearchInput from '@/components/SearchInput';
import SignalCard from '@/components/SignalCard';
import SimpleChart from '@/components/SimpleChart';
import TechnicalPanel from '@/components/TechnicalPanel';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StockAnalysis } from '@/types/stock';
import { Activity, BarChart3, Calendar, Globe, Search, Sunrise, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';

interface StockResearch {
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

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [research, setResearch] = useState<StockResearch | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');
  const { toast } = useToast();

  const handleSearchAndAnalyze = async (symbol: string) => {
    setIsLoading(true);
    setIsResearching(true);
    setAnalysis(null);
    setResearch(null);

    try {
      console.log('Analyzing and researching stock:', symbol);

      // Run both analysis and research in parallel
      const [analysisResult, researchResult] = await Promise.all([
        supabase.functions.invoke('analyze-stock', {
          body: { symbol: symbol.toUpperCase() }
        }),
        supabase.functions.invoke('research-stock', {
          body: { symbol: symbol.toUpperCase() }
        })
      ]);

      // Handle analysis result
      if (analysisResult.error) {
        throw new Error(analysisResult.error.message || 'Failed to analyze stock');
      }

      if (analysisResult.data && analysisResult.data.symbol) {
        setAnalysis(analysisResult.data);
      }

      // Handle research result
      if (researchResult.error) {
        console.warn('Research failed:', researchResult.error.message);
      } else if (researchResult.data) {
        setResearch(researchResult.data);
      }

      if (analysisResult.data && analysisResult.data.symbol) {
        setActiveTab('technical');
        toast({
          title: "Analysis Complete",
          description: `Generated ${analysisResult.data.signal} signal for ${analysisResult.data.symbol} with deep research`,
        });
      } else {
        toast({
          title: "Stock Not Found",
          description: `Unable to find data for "${symbol}". Please check the symbol and try again.`,
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Stock analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error.message || "Unable to analyze stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsResearching(false);
    }
  };

  const getRatingColor = (rating: string) => {
    switch (rating) {
      case 'STRONG_BUY': return 'bg-green-600';
      case 'BUY': return 'bg-green-400';
      case 'HOLD': return 'bg-yellow-500';
      case 'SELL': return 'bg-red-400';
      case 'STRONG_SELL': return 'bg-red-600';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="px-4 py-6 space-y-8">
        {/* Tabs Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-card">
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Sunrise className="h-4 w-4" />
              Morning Picks
            </TabsTrigger>
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              Stock Analysis
            </TabsTrigger>
          </TabsList>

          {/* Morning Recommendations Tab */}
          <TabsContent value="recommendations" className="mt-6">
            <MorningRecommendations />
          </TabsContent>

          {/* Stock Analysis Tab */}
          <TabsContent value="search" className="mt-6 space-y-8">
            <div className="flex flex-col items-center justify-center mb-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                  Stock Analysis & Research Center
                </h2>
                <p className="text-gray-400 max-w-2xl text-sm md:text-base">
                  Get comprehensive stock analysis including technical signals, business fundamentals,
                  sector trends, market sentiment, and latest news
                </p>
              </div>

              <div className="w-full max-w-md mb-4">
                <SearchInput onSearch={handleSearchAndAnalyze} isLoading={isLoading} />
              </div>

            </div>

            {/* Results Section */}
            {(analysis || research) && (
              <div className="mt-8 space-y-8">
                {/* Technical Analysis Section */}
                {analysis && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-2 mb-4">
                      <BarChart3 className="h-5 w-5" />
                      <h3 className="text-xl font-semibold">Technical Analysis</h3>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <div className="space-y-6">
                        <SignalCard analysis={analysis} />
                        <TechnicalPanel technicals={analysis.technicals} />
                      </div>
                      <div>
                        <SimpleChart analysis={analysis} />
                      </div>
                    </div>
                  </div>
                )}

                {/* Research Section */}
                {research && (
                  <div className="space-y-8">
                    <div className="flex items-center gap-2 mb-4">
                      <Search className="h-5 w-5" />
                      <h3 className="text-xl font-semibold">Deep Research</h3>
                    </div>

                    {/* Header Card */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xl font-bold">{research.companyName}</h4>
                          <p className="text-gray-400">{research.symbol} • {research.businessModel.sector}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full ${getRatingColor(research.recommendation.overallRating)} text-white`}>
                            {research.recommendation.overallRating}
                          </span>
                          <p className="text-sm text-gray-400 mt-1">
                            {research.recommendation.confidence}% confidence
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Business Overview */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Business Overview
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-gray-400">Industry</p>
                          <p>{research.businessModel.industry}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-400">Market Cap</p>
                          <p>₹{(research.businessModel.marketCap / 10000000).toFixed(2)} Cr</p>
                        </div>
                        <div className="md:col-span-2">
                          <p className="text-sm font-medium text-gray-400 mb-2">Business Description</p>
                          <p className="text-sm leading-relaxed">
                            {research.businessModel.description}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Financial Health */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <TrendingUp className="h-5 w-5" />
                        Financial Health
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">Revenue Growth</p>
                          <p className={`text-lg font-bold ${research.financialHealth.revenueGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {research.financialHealth.revenueGrowth > 0 ? '+' : ''}{research.financialHealth.revenueGrowth.toFixed(1)}%
                          </p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">Profit Margin</p>
                          <p className="text-lg font-bold">{research.financialHealth.profitMargin.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">ROE</p>
                          <p className="text-lg font-bold">{research.financialHealth.roe.toFixed(1)}%</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">Debt/Equity</p>
                          <p className="text-lg font-bold">{research.financialHealth.debtToEquity.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">Current Ratio</p>
                          <p className="text-lg font-bold">{research.financialHealth.currentRatio.toFixed(2)}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-400">Last Quarter Growth</p>
                          <p className={`text-lg font-bold ${research.financialHealth.lastQuarterGrowth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {research.financialHealth.lastQuarterGrowth > 0 ? '+' : ''}{research.financialHealth.lastQuarterGrowth.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Sector Analysis */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Globe className="h-5 w-5" />
                        Sector Analysis
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Sector Trend</p>
                          <span className={`px-2 py-1 rounded text-xs ${research.sectorAnalysis.sectorTrend === 'BULLISH' ? 'bg-green-500' : research.sectorAnalysis.sectorTrend === 'BEARISH' ? 'bg-red-500' : 'bg-gray-500'}`}>
                            {research.sectorAnalysis.sectorTrend}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Sector Performance</p>
                          <p className={`font-bold ${research.sectorAnalysis.sectorPerformance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {research.sectorAnalysis.sectorPerformance > 0 ? '+' : ''}{research.sectorAnalysis.sectorPerformance.toFixed(1)}%
                          </p>
                        </div>

                        <div>
                          <p className="font-medium mb-3">Peer Comparison</p>
                          <div className="space-y-2">
                            {research.sectorAnalysis.peerComparison.map((peer, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-white/5 rounded">
                                <div>
                                  <p className="font-medium text-sm">{peer.name}</p>
                                  <p className="text-xs text-gray-400">{peer.symbol}</p>
                                </div>
                                <p className={`font-bold text-sm ${peer.performance >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  {peer.performance > 0 ? '+' : ''}{peer.performance.toFixed(1)}%
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Market Sentiment */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <Activity className="h-5 w-5" />
                        Market Sentiment
                      </h4>
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-gray-400">Nifty Trend</p>
                            <span className={`px-2 py-1 rounded text-xs ${research.marketSentiment.niftyTrend === 'UPTREND' ? 'bg-green-500' : research.marketSentiment.niftyTrend === 'DOWNTREND' ? 'bg-red-500' : 'bg-gray-500'}`}>
                              {research.marketSentiment.niftyTrend}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-400">VIX</p>
                            <p className="text-lg font-bold">{research.marketSentiment.vix.toFixed(2)}</p>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2">FII/DII Flows</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3 bg-white/5 rounded">
                              <p className="text-sm text-gray-400">FII Flow</p>
                              <p className={`text-lg font-bold ${research.marketSentiment.fiiDii.fiiFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Math.abs(research.marketSentiment.fiiDii.fiiFlow).toFixed(0)} Cr
                              </p>
                            </div>
                            <div className="p-3 bg-white/5 rounded">
                              <p className="text-sm text-gray-400">DII Flow</p>
                              <p className={`text-lg font-bold ${research.marketSentiment.fiiDii.diiFlow >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                ₹{Math.abs(research.marketSentiment.fiiDii.diiFlow).toFixed(0)} Cr
                              </p>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2">Global Cues</p>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            <div className="text-center p-2 bg-white/5 rounded">
                              <p className="text-sm text-gray-400">Dow Futures</p>
                              <p className={`font-bold ${research.marketSentiment.globalCues.dowFutures >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {research.marketSentiment.globalCues.dowFutures > 0 ? '+' : ''}{research.marketSentiment.globalCues.dowFutures.toFixed(1)}%
                              </p>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded">
                              <p className="text-sm text-gray-400">Crude Oil</p>
                              <p className="font-bold">${research.marketSentiment.globalCues.crudePrice.toFixed(2)}</p>
                            </div>
                            <div className="text-center p-2 bg-white/5 rounded">
                              <p className="text-sm text-gray-400">USD/INR</p>
                              <p className="font-bold">{research.marketSentiment.globalCues.usdInr.toFixed(2)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* News & Events */}
                    <div className="space-y-4">
                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Calendar className="h-5 w-5" />
                          Upcoming Events
                        </h4>
                        <div className="space-y-3">
                          {research.newsEvents.upcomingEvents.map((event, index) => (
                            <div key={index} className="flex flex-col md:flex-row items-start md:items-center justify-between p-3 border border-white/10 rounded">
                              <div>
                                <p className="font-medium">{event.type}</p>
                                <p className="text-sm text-gray-400">{event.description}</p>
                              </div>
                              <span className="text-sm text-gray-400 mt-2 md:mt-0">{event.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                        <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Users className="h-5 w-5" />
                          Recent News
                        </h4>
                        <div className="space-y-3">
                          {research.newsEvents.recentNews.map((news, index) => (
                            <div key={index} className="p-3 border border-white/10 rounded space-y-2">
                              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
                                <h4 className="font-medium text-sm">{news.title}</h4>
                                <span className={`px-2 py-1 rounded text-xs ${news.sentiment === 'POSITIVE' ? 'bg-green-500' : news.sentiment === 'NEGATIVE' ? 'bg-red-500' : 'bg-gray-500'}`}>
                                  {news.sentiment}
                                </span>
                              </div>
                              <p className="text-sm text-gray-400">{news.summary}</p>
                              <div className="flex justify-between text-xs text-gray-400">
                                <span>{news.source}</span>
                                <span>{news.date}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Investment Recommendation */}
                    <div className="bg-white/5 border border-white/10 rounded-lg p-4 md:p-6">
                      <h4 className="text-lg font-semibold mb-4">Investment Recommendation</h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">Overall Rating</p>
                          <span className={`px-3 py-1 rounded-full ${getRatingColor(research.recommendation.overallRating)} text-white`}>
                            {research.recommendation.overallRating}
                          </span>
                        </div>

                        <div>
                          <p className="font-medium mb-2">Key Factors</p>
                          <div className="space-y-1">
                            {research.recommendation.keyFactors.map((factor, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-green-400" />
                                <span className="text-sm">{factor}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="font-medium mb-2">Key Risks</p>
                          <div className="space-y-1">
                            {research.recommendation.risks.map((risk, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <TrendingDown className="h-4 w-4 text-red-400" />
                                <span className="text-sm">{risk}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="p-3 bg-white/5 rounded">
                          <p className="text-sm">
                            <strong>Time Horizon:</strong> {research.recommendation.timeframe}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Empty State */}
            {!analysis && !research && !isLoading && !isResearching && (
              <div className="text-center py-12">
                <div className="max-w-md mx-auto">
                  <div className="text-6xl mb-4">📊</div>
                  <h3 className="text-lg font-semibold mb-2">
                    Ready to Analyze
                  </h3>
                  <p className="text-gray-400">
                    Enter a stock symbol above to get started with comprehensive analysis and research
                  </p>
                </div>
              </div>
            )}

          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Index;
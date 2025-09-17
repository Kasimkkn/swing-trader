import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import SearchInput from '@/components/SearchInput';
import SignalCard from '@/components/SignalCard';
import TechnicalPanel from '@/components/TechnicalPanel';
import SimpleChart from '@/components/SimpleChart';
import { StockAnalysis } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, TrendingDown, Activity, Globe, Calendar, Users, BarChart3, Search, Sunrise } from 'lucide-react';
import MorningRecommendations from '@/components/MorningRecommendations';

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

  const handleResearch = async (symbol: string) => {
    setIsResearching(true);
    setResearch(null);

    try {
      console.log('Researching stock:', symbol);

      const { data, error } = await supabase.functions.invoke('research-stock', {
        body: { symbol: symbol.toUpperCase() }
      });

      if (error) {
        throw new Error(error.message || 'Failed to research stock');
      }

      setResearch(data);
      setActiveTab('research');
      toast({
        title: "Research Complete",
        description: `Comprehensive analysis for ${data.symbol} completed`,
      });
    } catch (error: any) {
      console.error('Stock research error:', error);
      toast({
        title: "Research Failed",
        description: error.message || "Unable to research stock. Please try again.",
        variant: "destructive",
      });
    } finally {
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

  const currentSymbol = analysis?.symbol || research?.symbol || '';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="container mx-auto px-4 py-6 space-y-8">
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
            {/* Search Section */}
            <div className="flex flex-col items-center justify-center">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">
                  Stock Analysis & Deep Research
                </h2>
                <p className="text-muted-foreground max-w-2xl text-sm md:text-base">
                  Get comprehensive technical analysis and fundamental research in one click
                </p>
              </div>

              <div className="w-full max-w-md">
                <SearchInput 
                  onSearch={handleSearchAndAnalyze} 
                  isLoading={isLoading || isResearching}
                />
              </div>
            </div>

            {/* Results Section */}
            {(analysis || research) && (
              <div className="space-y-8">
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
                    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
                      <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                        <div>
                          <h4 className="text-xl font-bold">{research.companyName}</h4>
                          <p className="text-muted-foreground">{research.symbol} • {research.businessModel.sector}</p>
                        </div>
                        <div className="text-right">
                          <span className={`inline-block px-3 py-1 rounded-full ${getRatingColor(research.recommendation.overallRating)} text-white`}>
                            {research.recommendation.overallRating}
                          </span>
                          <p className="text-sm text-muted-foreground mt-1">
                            {research.recommendation.confidence}% confidence
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Investment Recommendation */}
                    <div className="bg-card border border-border rounded-lg p-4 md:p-6">
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

                        <div className="p-3 bg-muted rounded">
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
                  <p className="text-muted-foreground">
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
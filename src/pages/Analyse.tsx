import StockSearchInput from '@/components/StockSearchInput';
import SignalCard from '@/components/SignalCard';
import SimpleChart from '@/components/SimpleChart';
import TechnicalPanel from '@/components/TechnicalPanel';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { StockAnalysis, StockResearch } from '@/types/stock';
import { Activity, BarChart3, Calendar, Globe, Search, TrendingDown, TrendingUp, Users } from 'lucide-react';
import { useState } from 'react';


const Analyse = () => {
    const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
    const [research, setResearch] = useState<StockResearch | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isResearching, setIsResearching] = useState(false);
    const { toast } = useToast();

    const handleSearchAndAnalyze = async (symbol: string) => {
        setIsLoading(true);
        setIsResearching(true);
        setAnalysis(null);
        setResearch(null);

        try {
            console.log('Comprehensive analysis for stock:', symbol);

            // Single unified call for analysis (includes stock creation if needed)
            const analysisResult = await supabase.functions.invoke('analyze-stock', {
                body: { symbol: symbol.toUpperCase() }
            });

            // Handle analysis result
            if (analysisResult.error) {
                throw new Error(analysisResult.error.message || 'Failed to analyze stock');
            }

            if (analysisResult.data && analysisResult.data.symbol) {
                setAnalysis(analysisResult.data);
                
                // Fetch research in background (non-blocking)
                supabase.functions.invoke('research-stock', {
                    body: { symbol: symbol.toUpperCase() }
                }).then(researchResult => {
                    if (!researchResult.error && researchResult.data) {
                        setResearch(researchResult.data);
                    }
                    setIsResearching(false);
                }).catch(() => {
                    setIsResearching(false);
                });

                toast({
                    title: "Analysis Complete",
                    description: `${analysisResult.data.signal} signal for ${analysisResult.data.symbol} - ${analysisResult.data.recommendation}`,
                });
            } else {
                throw new Error(`Unable to find or fetch data for "${symbol}"`);
            }
        } catch (error: any) {
            console.error('Stock analysis error:', error);
            toast({
                title: "Analysis Failed",
                description: error.message || "Unable to analyze stock. Please verify the symbol.",
                variant: "destructive",
            });
            setIsResearching(false);
        } finally {
            setIsLoading(false);
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
        <>
            <div className="flex flex-col items-center justify-center mb-8">
                <div className="md:text-center mb-6">
                    <h2 className="text-lg md:text-3xl font-bold mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
                        Stock Analysis & Research Center
                    </h2>
                    <p className="text-gray-400 max-w-2xl text-xs md:text-sm">
                        Get comprehensive stock analysis including technical signals, business fundamentals,
                        sector trends, market sentiment, and latest news
                    </p>
                </div>

                <div className="w-full max-w-md mb-4">
                    <StockSearchInput onSearch={handleSearchAndAnalyze} isLoading={isLoading} />
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

                            {/* Recommendation Banner */}
                            {analysis.recommendation && (
                                <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 mb-6">
                                    <div className="flex items-start gap-3">
                                        <Activity className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="font-semibold text-primary mb-1">Expert Recommendation</h4>
                                            <p className="text-sm">{analysis.recommendation}</p>
                                            {analysis.timeframe && (
                                                <p className="text-xs text-muted-foreground mt-2">
                                                    Timeframe: {analysis.timeframe}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

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
                                    <div className="">
                                        <span className={`inline-block px-4 py-0 rounded-full ${getRatingColor(research.recommendation.overallRating)} text-white`}>
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

        </>
    )
}

export default Analyse
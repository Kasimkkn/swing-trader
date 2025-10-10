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
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSearchAndAnalyze = async (symbol: string) => {
        setIsLoading(true);
        setAnalysis(null);

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
            {analysis && (
                <div className="mt-8 space-y-8">
                    {/* Technical Analysis Section */}
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
                </div>
            )}

            {/* Empty State */}
            {!analysis && !isLoading && (
                <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                        <div className="text-6xl mb-4">📊</div>
                        <h3 className="text-lg font-semibold mb-2">
                            Ready to Analyze
                        </h3>
                        <p className="text-gray-400">
                            Enter a stock symbol above to get comprehensive technical analysis with swing trading signals
                        </p>
                    </div>
                </div>
            )}

        </>
    )
}

export default Analyse
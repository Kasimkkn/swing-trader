import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import SearchInput from '@/components/SearchInput';
import SignalCard from '@/components/SignalCard';
import TechnicalPanel from '@/components/TechnicalPanel';
import SimpleChart from '@/components/SimpleChart';
import { StockAnalysis } from '@/types/stock';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (symbol: string) => {
    setIsLoading(true);
    setAnalysis(null);

    try {
      console.log('Analyzing stock:', symbol);

      const { data, error } = await supabase.functions.invoke('analyze-stock', {
        body: { symbol: symbol.toUpperCase() }
      });

      if (error) {
        throw new Error(error.message || 'Failed to analyze stock');
      }

      if (data && data.symbol) {
        setAnalysis(data);
        toast({
          title: "Analysis Complete",
          description: `Generated ${data.signal} signal for ${data.symbol} (${data.confidence}% confidence)`,
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
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="px-4 py-8">
        {/* Search Section */}
        <div className='grid grid-cols-1'>
          <div className="mb-8">
            <div className='flex flex-col gap-2 justify-center items-center'>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Stock Signal Analysis
              </h2>
              <p className="text-muted-foreground mb-6">
                Get automated buy/avoid recommendations with entry, stop-loss, and target prices
              </p>
              <SearchInput onSearch={handleSearch} isLoading={isLoading} />
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-2'>
              <div>
                {/* Results Section */}
                {analysis && (
                  <div className="space-y-6 py-4">
                    {/* Main Signal Card */}
                    <SignalCard analysis={analysis} />
                    <TechnicalPanel technicals={analysis.technicals} />
                    <SimpleChart analysis={analysis} />
                  </div>
                )}

                {/* Empty State */}
                {!analysis && !isLoading && (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <div className="text-6xl mb-4">📈</div>
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Ready to Analyze
                      </h3>
                      <p className="text-muted-foreground">
                        Enter a stock symbol above to get started with professional signal analysis
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <div>
                {/* News Section And other info */}

              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
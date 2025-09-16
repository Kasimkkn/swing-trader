import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import Header from '@/components/Header';
import SearchInput from '@/components/SearchInput';
import SignalCard from '@/components/SignalCard';
import TechnicalPanel from '@/components/TechnicalPanel';
import SimpleChart from '@/components/SimpleChart';
import { StockAnalysis } from '@/types/stock';
import { getStockAnalysis } from '@/services/mockData';

const Index = () => {
  const [analysis, setAnalysis] = useState<StockAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (symbol: string) => {
    setIsLoading(true);
    setAnalysis(null);
    
    try {
      const result = await getStockAnalysis(symbol);
      
      if (result) {
        setAnalysis(result);
        toast({
          title: "Analysis Complete",
          description: `Generated ${result.signal} signal for ${result.symbol}`,
        });
      } else {
        toast({
          title: "Stock Not Found",
          description: `No analysis available for "${symbol}". Try RELIANCE, TCS, LODHA, SUZLON, or ZOMATO.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze stock. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* Search Section */}
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Stock Signal Analysis
          </h2>
          <p className="text-muted-foreground mb-6">
            Get automated buy/avoid recommendations with entry, stop-loss, and target prices
          </p>
          
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
        </div>

        {/* Results Section */}
        {analysis && (
          <div className="space-y-6">
            {/* Main Signal Card */}
            <SignalCard analysis={analysis} />
            
            {/* Supporting Panels */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TechnicalPanel technicals={analysis.technicals} />
              <SimpleChart analysis={analysis} />
            </div>
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
      </main>
      
      {/* Footer */}
      <footer className="border-t border-border bg-background mt-16">
        <div className="mx-auto max-w-6xl px-4 py-6">
          <p className="text-center text-sm text-muted-foreground">
            <strong>Disclaimer:</strong> This tool uses mock data for demonstration purposes only. 
            Not intended for actual investment decisions. Always consult with financial advisors.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
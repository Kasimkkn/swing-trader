import { useState } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchInputProps {
  onSearch: (symbol: string) => void;
  isLoading: boolean;
}

const SearchInput = ({ onSearch, isLoading }: SearchInputProps) => {
  const [symbol, setSymbol] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (symbol.trim()) {
      onSearch(symbol.trim());
    }
  };

  const recentSearches = ['RELIANCE', 'TCS', 'LODHA'];

  return (
    <div className="w-full max-w-md space-y-4">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Enter stock symbol (e.g. RELIANCE, NSE:TCS)"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            className="pl-10 bg-input border-border text-foreground placeholder:text-muted-foreground"
            disabled={isLoading}
          />
        </div>
        <Button
          type="submit"
          disabled={isLoading || !symbol.trim()}
          className="text-white hover:bg-text-white/90 text-background font-medium px-6"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            'Analyze'
          )}
        </Button>
      </form>

      {recentSearches.length > 0 && !isLoading && (
        <div className="flex gap-2 items-baseline md:justify-center">
          <p className="text-sm text-muted-foreground mb-2">Try:</p>
          <div className="flex flex-wrap gap-2">
            {recentSearches.map((recent) => (
              <button
                key={recent}
                onClick={() => {
                  setSymbol(recent);
                  onSearch(recent);
                }}
                className="px-3 py-1 text-xs bg-accent hover:bg-accent/80 text-accent-foreground rounded border border-border transition-colors"
              >
                {recent}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchInput;
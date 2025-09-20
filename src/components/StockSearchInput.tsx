import { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Stock {
  id: string;
  symbol: string;
  company_name: string;
  current_price?: number;
}

interface StockSearchInputProps {
  onSearch: (symbol: string) => void;
  onStockSelect?: (stock: Stock) => void;
  isLoading: boolean;
  placeholder?: string;
  showSearchButton?: boolean;
}

const StockSearchInput = ({ 
  onSearch, 
  onStockSelect, 
  isLoading, 
  placeholder = "Enter stock symbol (e.g., RELIANCE, TCS)",
  showSearchButton = true 
}: StockSearchInputProps) => {
  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<Stock[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current && 
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchSuggestions = async (query: string) => {
    if (query.length < 1) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    try {
      const { data, error } = await supabase
        .from('stocks')
        .select('id, symbol, company_name, current_price')
        .or(`symbol.ilike.%${query}%,company_name.ilike.%${query}%`)
        .limit(10);

      if (error) throw error;

      setSuggestions(data || []);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoadingSuggestions(false);
    }
  };

  const handleInputChange = (value: string) => {
    setInputValue(value);
    
    // Debounce suggestions
    const timeoutId = setTimeout(() => {
      fetchSuggestions(value);
    }, 300);

    return () => clearTimeout(timeoutId);
  };

  const handleSuggestionClick = (stock: Stock) => {
    setInputValue(stock.symbol);
    setShowSuggestions(false);
    if (onStockSelect) {
      onStockSelect(stock);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSearch(inputValue.trim().toUpperCase());
      setShowSuggestions(false);
    }
  };

  return (
    <div className="relative w-full">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={(e) => handleInputChange(e.target.value)}
              placeholder={placeholder}
              className="pl-9 pr-4 py-2 bg-white/5 border-white/20 text-white placeholder-gray-400 focus:border-white/40"
              disabled={isLoading}
              onFocus={() => {
                if (inputValue && suggestions.length > 0) {
                  setShowSuggestions(true);
                }
              }}
            />
            {isLoadingSuggestions && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div 
              ref={suggestionsRef}
              className="absolute top-full left-0 right-0 z-50 mt-1 bg-gray-900 border border-white/20 rounded-md shadow-lg max-h-60 overflow-y-auto"
            >
              {suggestions.map((stock) => (
                <button
                  key={stock.id}
                  type="button"
                  onClick={() => handleSuggestionClick(stock)}
                  className="w-full px-4 py-3 text-left hover:bg-white/10 border-b border-white/5 last:border-b-0 transition-colors"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-white">{stock.symbol}</div>
                      <div className="text-sm text-gray-400 truncate">{stock.company_name}</div>
                    </div>
                    {stock.current_price && (
                      <div className="text-sm text-gray-300">₹{stock.current_price.toFixed(2)}</div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {showSearchButton && (
          <Button 
            type="submit" 
            disabled={isLoading || !inputValue.trim()}
            className="bg-white text-black hover:bg-gray-200 disabled:opacity-50"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Analyze"
            )}
          </Button>
        )}
      </form>
    </div>
  );
};

export default StockSearchInput;
-- Drop all existing tables except the ones we'll recreate
DROP TABLE IF EXISTS corporate_actions CASCADE;
DROP TABLE IF EXISTS market_sentiment CASCADE;
DROP TABLE IF EXISTS sector_performance CASCADE;
DROP TABLE IF EXISTS stock_analysis CASCADE;
DROP TABLE IF EXISTS stock_events CASCADE;
DROP TABLE IF EXISTS stock_news CASCADE;
DROP TABLE IF EXISTS stock_prices CASCADE;
DROP TABLE IF EXISTS stock_research_cache CASCADE;
DROP TABLE IF EXISTS technical_indicators CASCADE;
DROP TABLE IF EXISTS companies CASCADE;

-- 1. Parent Stock Master Table
CREATE TABLE public.stocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  current_price NUMERIC,
  industry_category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.stocks ENABLE ROW LEVEL SECURITY;

-- RLS policies for stocks
CREATE POLICY "Anyone can view stocks" ON public.stocks FOR SELECT USING (true);

-- 2. AI-Recommended Stocks Table (no duplicates per day)
CREATE TABLE public.ai_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'SELL', 'HOLD')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  target_price NUMERIC,
  stop_loss NUMERIC,
  entry_price NUMERIC,
  ema9 NUMERIC,
  ema20 NUMERIC,
  rsi NUMERIC,
  reasons TEXT[],
  recommendation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stock_id, recommendation_date)
);

-- Enable RLS
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for AI recommendations
CREATE POLICY "Anyone can view AI recommendations" ON public.ai_recommendations FOR SELECT USING (true);

-- 3. Search/Analysis Table
CREATE TABLE public.search_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  analysis_type TEXT NOT NULL DEFAULT 'SEARCH',
  technical_data JSONB,
  fundamental_data JSONB,
  search_query TEXT,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.search_analysis ENABLE ROW LEVEL SECURITY;

-- RLS policies for search analysis
CREATE POLICY "Anyone can view search analysis" ON public.search_analysis FOR SELECT USING (true);

-- 4. Portfolio Table
CREATE TABLE public.portfolio (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  buying_price NUMERIC NOT NULL CHECK (buying_price > 0),
  selling_price NUMERIC CHECK (selling_price > 0),
  status TEXT NOT NULL DEFAULT 'hold' CHECK (status IN ('hold', 'sold')),
  buy_date DATE NOT NULL DEFAULT CURRENT_DATE,
  sell_date DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio
CREATE POLICY "Anyone can view portfolio" ON public.portfolio FOR SELECT USING (true);
CREATE POLICY "Anyone can insert portfolio" ON public.portfolio FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update portfolio" ON public.portfolio FOR UPDATE USING (true);

-- 5. Wishlist Table
CREATE TABLE public.wishlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(stock_id)
);

-- Enable RLS
ALTER TABLE public.wishlist ENABLE ROW LEVEL SECURITY;

-- RLS policies for wishlist
CREATE POLICY "Anyone can view wishlist" ON public.wishlist FOR SELECT USING (true);
CREATE POLICY "Anyone can insert wishlist" ON public.wishlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can delete wishlist" ON public.wishlist FOR DELETE USING (true);

-- Create indexes for better performance
CREATE INDEX idx_stocks_symbol ON public.stocks (symbol);
CREATE INDEX idx_ai_recommendations_date ON public.ai_recommendations (recommendation_date);
CREATE INDEX idx_ai_recommendations_stock_date ON public.ai_recommendations (stock_id, recommendation_date);
CREATE INDEX idx_search_analysis_stock ON public.search_analysis (stock_id);
CREATE INDEX idx_portfolio_stock ON public.portfolio (stock_id);
CREATE INDEX idx_portfolio_status ON public.portfolio (status);
CREATE INDEX idx_wishlist_stock ON public.wishlist (stock_id);

-- Create triggers for updated_at columns
CREATE TRIGGER update_stocks_updated_at
  BEFORE UPDATE ON public.stocks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_recommendations_updated_at
  BEFORE UPDATE ON public.ai_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_search_analysis_updated_at
  BEFORE UPDATE ON public.search_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_portfolio_updated_at
  BEFORE UPDATE ON public.portfolio
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_wishlist_updated_at
  BEFORE UPDATE ON public.wishlist
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some popular Indian stocks as seed data
INSERT INTO public.stocks (symbol, company_name, industry_category) VALUES
('RELIANCE', 'Reliance Industries Limited', 'Oil & Gas'),
('TCS', 'Tata Consultancy Services Limited', 'Information Technology'),
('INFY', 'Infosys Limited', 'Information Technology'),
('HDFC', 'HDFC Limited', 'Financial Services'),
('ICICIBANK', 'ICICI Bank Limited', 'Financial Services'),
('HDFCBANK', 'HDFC Bank Limited', 'Financial Services'),
('KOTAKBANK', 'Kotak Mahindra Bank Limited', 'Financial Services'),
('BHARTIARTL', 'Bharti Airtel Limited', 'Telecommunications'),
('ITC', 'ITC Limited', 'FMCG'),
('SBIN', 'State Bank of India', 'Financial Services'),
('LT', 'Larsen & Toubro Limited', 'Construction'),
('ASIANPAINT', 'Asian Paints Limited', 'Chemicals & Petrochemicals'),
('MARUTI', 'Maruti Suzuki India Limited', 'Automobile'),
('BAJFINANCE', 'Bajaj Finance Limited', 'Financial Services'),
('HCLTECH', 'HCL Technologies Limited', 'Information Technology'),
('WIPRO', 'Wipro Limited', 'Information Technology'),
('ULTRACEMCO', 'UltraTech Cement Limited', 'Cement'),
('TITAN', 'Titan Company Limited', 'Consumer Goods'),
('NESTLEIND', 'Nestle India Limited', 'FMCG'),
('POWERGRID', 'Power Grid Corporation of India Limited', 'Power');
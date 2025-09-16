-- Create tables for stock data storage

-- Companies/Symbols table
CREATE TABLE public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  exchange TEXT DEFAULT 'NSE',
  sector TEXT,
  market_cap BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Stock price data (OHLCV)
CREATE TABLE public.stock_prices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  open_price DECIMAL(10,2) NOT NULL,
  high_price DECIMAL(10,2) NOT NULL,
  low_price DECIMAL(10,2) NOT NULL,
  close_price DECIMAL(10,2) NOT NULL,
  volume BIGINT NOT NULL,
  adjusted_close DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, date)
);

-- Technical indicators
CREATE TABLE public.technical_indicators (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  date DATE NOT NULL,
  rsi_14 DECIMAL(5,2),
  macd_line DECIMAL(10,4),
  macd_signal DECIMAL(10,4),
  macd_histogram DECIMAL(10,4),
  ma_50 DECIMAL(10,2),
  ma_200 DECIMAL(10,2),
  bollinger_upper DECIMAL(10,2),
  bollinger_lower DECIMAL(10,2),
  bollinger_middle DECIMAL(10,2),
  atr_14 DECIMAL(10,4),
  volume_sma_20 BIGINT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(symbol, date)
);

-- Stock analysis results
CREATE TABLE public.stock_analysis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal TEXT NOT NULL CHECK (signal IN ('BUY', 'AVOID')),
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  current_price DECIMAL(10,2) NOT NULL,
  entry_price DECIMAL(10,2),
  stop_loss DECIMAL(10,2),
  target_price DECIMAL(10,2),
  risk_reward TEXT,
  reasons TEXT[] NOT NULL DEFAULT '{}',
  analysis_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '4 hours'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.technical_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_analysis ENABLE ROW LEVEL SECURITY;

-- Create policies (public read access for stock data)
CREATE POLICY "Anyone can view companies" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Anyone can view stock prices" ON public.stock_prices FOR SELECT USING (true);
CREATE POLICY "Anyone can view technical indicators" ON public.technical_indicators FOR SELECT USING (true);
CREATE POLICY "Anyone can view stock analysis" ON public.stock_analysis FOR SELECT USING (true);

-- Create indexes for performance
CREATE INDEX idx_stock_prices_symbol_date ON public.stock_prices(symbol, date DESC);
CREATE INDEX idx_technical_indicators_symbol_date ON public.technical_indicators(symbol, date DESC);
CREATE INDEX idx_stock_analysis_symbol ON public.stock_analysis(symbol);
CREATE INDEX idx_stock_analysis_expires_at ON public.stock_analysis(expires_at);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_stock_analysis_updated_at
  BEFORE UPDATE ON public.stock_analysis
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some initial company data
INSERT INTO public.companies (symbol, company_name, exchange, sector) VALUES
('RELIANCE', 'Reliance Industries Limited', 'NSE', 'Oil & Gas'),
('TCS', 'Tata Consultancy Services Limited', 'NSE', 'Information Technology'),
('LODHA', 'Macrotech Developers Limited', 'NSE', 'Real Estate'),
('HDFCBANK', 'HDFC Bank Limited', 'NSE', 'Banking'),
('INFY', 'Infosys Limited', 'NSE', 'Information Technology'),
('HINDUNILVR', 'Hindustan Unilever Limited', 'NSE', 'FMCG'),
('ITC', 'ITC Limited', 'NSE', 'FMCG'),
('SBIN', 'State Bank of India', 'NSE', 'Banking'),
('BHARTIARTL', 'Bharti Airtel Limited', 'NSE', 'Telecommunications'),
('KOTAKBANK', 'Kotak Mahindra Bank Limited', 'NSE', 'Banking')
ON CONFLICT (symbol) DO NOTHING;
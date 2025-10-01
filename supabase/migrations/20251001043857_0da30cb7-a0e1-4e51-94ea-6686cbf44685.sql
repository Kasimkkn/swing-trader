-- Create transactions table for recording all buy/sell activities
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stock_id UUID NOT NULL REFERENCES public.stocks(id) ON DELETE CASCADE,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('BUY', 'SELL')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_per_share NUMERIC NOT NULL CHECK (price_per_share > 0),
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- RLS policies for transactions
CREATE POLICY "Anyone can view transactions"
  ON public.transactions
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert transactions"
  ON public.transactions
  FOR INSERT
  WITH CHECK (true);

-- Add index for faster queries
CREATE INDEX idx_transactions_stock_id ON public.transactions(stock_id);
CREATE INDEX idx_transactions_date ON public.transactions(transaction_date DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
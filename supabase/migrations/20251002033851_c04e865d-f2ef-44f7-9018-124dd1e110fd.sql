-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Enable pg_net extension for HTTP requests
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Schedule the morning-recommendations function to run every 2 hours
-- This will automatically analyze all stocks and generate recommendations
SELECT cron.schedule(
  'generate-morning-recommendations',
  '0 */2 * * *', -- Every 2 hours at minute 0
  $$
  SELECT
    net.http_post(
        url:='https://lkvfmtaxtdfrhmdkauwv.supabase.co/functions/v1/morning-recommendations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdmZtdGF4dGRmcmhtZGthdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTgwNDEsImV4cCI6MjA3MzU3NDA0MX0.TIvUKFtBtBQMPL4hakYzRJX-KvXbGUgQzcg-QbaP8ZQ"}'::jsonb,
        body:=concat('{"scheduled": true, "timestamp": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);

-- Add index on recommendation_date for faster queries
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_date ON public.ai_recommendations(recommendation_date DESC);

-- Add index on signal for filtering
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_signal ON public.ai_recommendations(signal);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_date_signal ON public.ai_recommendations(recommendation_date DESC, signal);
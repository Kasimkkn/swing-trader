-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create cron job to run morning-recommendations every 15 minutes
SELECT cron.schedule(
  'morning-recommendations-15min',
  '*/15 * * * *', -- Every 15 minutes
  $$
  SELECT
    net.http_post(
        url:='https://lkvfmtaxtdfrhmdkauwv.supabase.co/functions/v1/morning-recommendations',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxrdmZtdGF4dGRmcmhtZGthdXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTgwNDEsImV4cCI6MjA3MzU3NDA0MX0.TIvUKFtBtBQMPL4hakYzRJX-KvXbGUgQzcg-QbaP8ZQ"}'::jsonb,
        body:=concat('{"triggered_at": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
-- Remove unnecessary columns from ai_recommendations table
ALTER TABLE ai_recommendations 
DROP COLUMN IF EXISTS ema9,
DROP COLUMN IF EXISTS ema20,
DROP COLUMN IF EXISTS rsi,
DROP COLUMN IF EXISTS reasons;
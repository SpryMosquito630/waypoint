-- Add silver and gold balances
ALTER TABLE public.game_state
  ADD COLUMN IF NOT EXISTS silver_count INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gold_count INT NOT NULL DEFAULT 0;

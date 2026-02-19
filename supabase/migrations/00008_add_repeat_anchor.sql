-- Add repeat anchor for permanent tasks (e.g., day of week/month or time of day)
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS repeat_anchor TEXT;

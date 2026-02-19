-- Add repeat interval for permanent tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS repeat_interval_days INT;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_repeat_interval_days_positive
  CHECK (repeat_interval_days IS NULL OR repeat_interval_days > 0);

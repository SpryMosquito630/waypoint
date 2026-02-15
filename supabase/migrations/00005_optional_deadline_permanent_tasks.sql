-- Allow optional deadlines and support permanent tasks
ALTER TABLE public.tasks
  ALTER COLUMN deadline DROP NOT NULL;

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_permanent BOOLEAN NOT NULL DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_permanent
  ON public.tasks (is_permanent);

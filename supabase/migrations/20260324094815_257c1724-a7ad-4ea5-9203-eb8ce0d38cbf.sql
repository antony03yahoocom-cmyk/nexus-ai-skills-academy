ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS approval_mode text NOT NULL DEFAULT 'manual';

COMMENT ON COLUMN public.courses.approval_mode IS 'Assignment approval mode: manual, auto_basic, auto_smart';
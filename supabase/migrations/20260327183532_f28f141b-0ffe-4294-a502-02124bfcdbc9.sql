
-- 1. Fix enrollment self-update: restrict to progress-only changes
DROP POLICY IF EXISTS "Users can update own enrollments" ON public.enrollments;
DROP POLICY IF EXISTS "Users can update own enrollment progress" ON public.enrollments;

CREATE POLICY "Users can update own enrollment progress" ON public.enrollments
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Trigger to prevent users from changing protected fields
CREATE OR REPLACE FUNCTION public.restrict_enrollment_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.user_id != OLD.user_id OR NEW.course_id != OLD.course_id OR NEW.enrolled_at != OLD.enrolled_at OR NEW.id != OLD.id THEN
    RAISE EXCEPTION 'Cannot modify enrollment fields other than progress';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enrollment_restrict_update ON public.enrollments;

CREATE TRIGGER enrollment_restrict_update
  BEFORE UPDATE ON public.enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_enrollment_update();

-- 2. Modules: keep public for course browsing (structure only, lessons are RLS-protected)
-- The current policy is acceptable since lessons themselves are protected by has_course_access.
-- Module titles are needed for the course detail page before enrollment.
-- No change needed — marking as acknowledged.

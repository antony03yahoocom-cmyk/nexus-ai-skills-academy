
-- 1. Prevent users from self-granting premium access via profile UPDATE
-- Use a trigger to block changes to is_premium and subscription_status by non-admins
CREATE OR REPLACE FUNCTION public.protect_premium_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- If premium fields are being changed, only allow if caller is admin
  IF (NEW.is_premium IS DISTINCT FROM OLD.is_premium OR NEW.subscription_status IS DISTINCT FROM OLD.subscription_status) THEN
    IF NOT has_role(auth.uid(), 'admin') THEN
      NEW.is_premium := OLD.is_premium;
      NEW.subscription_status := OLD.subscription_status;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER protect_premium_fields_trigger
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.protect_premium_fields();

-- 2. Block non-admin UPDATE and DELETE on user_roles
CREATE POLICY "Only admins can update roles" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete roles" ON public.user_roles
  FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- 3. Tighten certificates INSERT policy to require enrollment
DROP POLICY IF EXISTS "Students can see pending certificates" ON public.certificates;
CREATE POLICY "Students can request certificates for enrolled courses" ON public.certificates
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = student_id
    AND EXISTS (
      SELECT 1 FROM enrollments e WHERE e.user_id = auth.uid() AND e.course_id = certificates.course_id
    )
    AND has_course_access(auth.uid(), certificates.course_id)
  );

-- 4. Make assignment-files bucket private and remove anon policies
UPDATE storage.buckets SET public = false WHERE id = 'assignment-files';

DROP POLICY IF EXISTS "Public Read Assignments" ON storage.objects;
DROP POLICY IF EXISTS "Public Access to Assignment Files" ON storage.objects;
DROP POLICY IF EXISTS "Public Read" ON storage.objects;

-- Also make lesson-attachments private (it's also public and shouldn't be)
UPDATE storage.buckets SET public = false WHERE id = 'lesson-attachments';

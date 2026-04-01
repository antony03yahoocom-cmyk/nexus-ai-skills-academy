
-- 1. Block self-insert on user_roles: only admins can insert
CREATE POLICY "Only admins can insert roles" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- 2. Restrict modules to authenticated users only
DROP POLICY IF EXISTS "Anyone can view modules of published courses" ON public.modules;
CREATE POLICY "Authenticated users can view modules of published courses" ON public.modules
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM courses
      WHERE courses.id = modules.course_id
      AND (courses.is_published = true OR has_role(auth.uid(), 'admin'))
    )
  );

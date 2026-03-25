
-- Create a security definer function to check course access (enrollment + payment/premium/trial)
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- User is admin
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- User is enrolled AND (has paid for course OR is premium)
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = _user_id AND e.course_id = _course_id
    AND (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id AND p.is_premium = true)
      OR EXISTS (SELECT 1 FROM public.course_purchases cp WHERE cp.user_id = _user_id AND cp.course_id = _course_id AND cp.status = 'paid')
      OR EXISTS (
        -- Active trial for this course
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = _user_id 
        AND p.trial_course_id = _course_id 
        AND p.trial_start_date + interval '7 days' > now()
      )
    )
  )
$$;

-- Fix lessons RLS: drop old permissive policy, add enrollment-based one
DROP POLICY IF EXISTS "Authenticated users can view lessons" ON public.lessons;

CREATE POLICY "Enrolled users can view lessons" ON public.lessons
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.modules m
    JOIN public.courses c ON c.id = m.course_id
    WHERE m.id = lessons.module_id
    AND c.is_published = true
    AND public.has_course_access(auth.uid(), c.id)
  )
);

-- Fix assignments RLS: drop old permissive policy, add enrollment-based one
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON public.assignments;

CREATE POLICY "Enrolled users can view assignments" ON public.assignments
FOR SELECT TO authenticated
USING (
  has_role(auth.uid(), 'admin') OR
  EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = assignments.lesson_id
    AND public.has_course_access(auth.uid(), m.course_id)
  )
);

-- Fix lesson_completions INSERT RLS: require enrollment
DROP POLICY IF EXISTS "Users can mark lessons complete" ON public.lesson_completions;

CREATE POLICY "Enrolled users can mark lessons complete" ON public.lesson_completions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public.lessons l
    JOIN public.modules m ON m.id = l.module_id
    WHERE l.id = lesson_completions.lesson_id
    AND public.has_course_access(auth.uid(), m.course_id)
  )
);


-- Fix the overly permissive insert policy on certificates
DROP POLICY "Service role can insert certificates" ON public.certificates;
-- Allow authenticated users to have certificates inserted for them (edge function uses service role which bypasses RLS anyway)
CREATE POLICY "Students can see pending certificates" ON public.certificates FOR INSERT WITH CHECK (auth.uid() = student_id);

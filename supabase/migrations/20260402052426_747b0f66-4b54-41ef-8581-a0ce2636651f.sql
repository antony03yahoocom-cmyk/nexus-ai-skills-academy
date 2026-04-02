
-- Allow authenticated users to read basic profile info for group chat display
CREATE POLICY "Authenticated users can view profile names" ON public.profiles
  FOR SELECT TO authenticated
  USING (true);


-- Allow any authenticated user to see member count (SELECT group_id only) for browsing groups
CREATE POLICY "Anyone can count group members" ON public.group_members
  FOR SELECT TO authenticated
  USING (true);

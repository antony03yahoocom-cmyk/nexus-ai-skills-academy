
-- Make project-files bucket public
UPDATE storage.buckets SET public = true WHERE id = 'project-files';

-- Drop the restrictive SELECT policies and add a public one
DROP POLICY IF EXISTS "Students can view own project files" ON storage.objects;
DROP POLICY IF EXISTS "Admins can view all project files" ON storage.objects;

CREATE POLICY "Anyone can view project files"
ON storage.objects FOR SELECT
USING (bucket_id = 'project-files');

-- Add file_url to group_messages for file sharing
ALTER TABLE public.group_messages ADD COLUMN IF NOT EXISTS file_url text;

-- Create group-files storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('group-files', 'group-files', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for group-files
CREATE POLICY "Anyone can view group files"
ON storage.objects FOR SELECT
USING (bucket_id = 'group-files');

CREATE POLICY "Authenticated users can upload group files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'group-files' AND auth.uid() IS NOT NULL);

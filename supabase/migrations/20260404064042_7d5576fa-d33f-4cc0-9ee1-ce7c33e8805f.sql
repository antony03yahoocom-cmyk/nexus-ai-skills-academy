
UPDATE storage.buckets SET public = true WHERE id = 'assignment-files';

CREATE POLICY "Public read access for assignment files"
ON storage.objects FOR SELECT
USING (bucket_id = 'assignment-files');


-- Add objective, task, deliverable fields to assignments
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS objective text;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS task text;
ALTER TABLE public.assignments ADD COLUMN IF NOT EXISTS deliverable text;

-- Add status and feedback to submissions
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'Pending';
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS feedback text;
ALTER TABLE public.submissions ADD COLUMN IF NOT EXISTS submission_files jsonb DEFAULT '[]'::jsonb;

-- Allow admins to update submissions (for approve/reject)
CREATE POLICY "Admins can manage submissions"
ON public.submissions FOR ALL
TO public
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow users to update own submissions (for resubmit)
CREATE POLICY "Users can update own submissions"
ON public.submissions FOR UPDATE
TO public
USING (auth.uid() = user_id);

-- Create storage buckets for lesson attachments and assignment files
INSERT INTO storage.buckets (id, name, public) VALUES ('lesson-attachments', 'lesson-attachments', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-files', 'assignment-files', false) ON CONFLICT DO NOTHING;

-- Storage policies for lesson-attachments
CREATE POLICY "Anyone can view lesson attachments" ON storage.objects FOR SELECT TO public USING (bucket_id = 'lesson-attachments');
CREATE POLICY "Admins can upload lesson attachments" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'lesson-attachments' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete lesson attachments" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'lesson-attachments' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for assignment-files
CREATE POLICY "Users can upload assignment files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'assignment-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own assignment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'assignment-files' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Admins can view all assignment files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'assignment-files' AND has_role(auth.uid(), 'admin'::app_role));

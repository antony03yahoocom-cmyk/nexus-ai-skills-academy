
-- Create enums for project and certificate status
CREATE TYPE public.project_status AS ENUM ('Draft', 'Submitted', 'Approved', 'Rejected');
CREATE TYPE public.certificate_status AS ENUM ('Pending', 'Issued');

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  project_files JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status project_status NOT NULL DEFAULT 'Draft',
  public_visibility BOOLEAN NOT NULL DEFAULT false,
  admin_feedback TEXT
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own projects" ON public.projects FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can insert own projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own projects" ON public.projects FOR UPDATE USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage projects" ON public.projects FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Public approved projects visible to all" ON public.projects FOR SELECT USING (public_visibility = true AND status = 'Approved');

-- Certificates table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  issued_date DATE DEFAULT CURRENT_DATE,
  certificate_link TEXT,
  status certificate_status NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view own certificates" ON public.certificates FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service role can insert certificates" ON public.certificates FOR INSERT WITH CHECK (true);

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('project-files', 'project-files', false);
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', false);

-- Storage policies for project-files
CREATE POLICY "Students can upload project files" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Students can view own project files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can view all project files" ON storage.objects FOR SELECT USING (bucket_id = 'project-files' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for certificates
CREATE POLICY "Students can view own certificates files" ON storage.objects FOR SELECT USING (bucket_id = 'certificates' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Admins can manage certificate files" ON storage.objects FOR ALL USING (bucket_id = 'certificates' AND has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Service can upload certificates" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'certificates');

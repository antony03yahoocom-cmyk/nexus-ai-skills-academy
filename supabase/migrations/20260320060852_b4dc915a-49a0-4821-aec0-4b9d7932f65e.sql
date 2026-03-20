
-- Add price column to courses (in KES, integer)
ALTER TABLE public.courses ADD COLUMN price integer NOT NULL DEFAULT 0;

-- Create course_purchases table to track per-course purchases
CREATE TABLE public.course_purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  amount integer NOT NULL DEFAULT 0,
  reference text,
  status text NOT NULL DEFAULT 'pending',
  purchased_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.course_purchases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own purchases" ON public.course_purchases
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own purchases" ON public.course_purchases
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all purchases" ON public.course_purchases
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage purchases" ON public.course_purchases
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Add trial_course_id and is_premium to profiles
ALTER TABLE public.profiles ADD COLUMN trial_course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;
ALTER TABLE public.profiles ADD COLUMN is_premium boolean NOT NULL DEFAULT false;

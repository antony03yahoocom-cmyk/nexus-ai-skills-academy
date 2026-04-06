
-- 1. Fix purchase_status_fraud: force status='pending' on user inserts
DROP POLICY IF EXISTS "Users can insert own purchases" ON public.course_purchases;
CREATE POLICY "Users can insert own purchases" ON public.course_purchases
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- 2. Fix premium_self_grant: add trigger to prevent non-admins changing premium fields
CREATE OR REPLACE FUNCTION public.prevent_premium_self_grant()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  IF NOT has_role(auth.uid(), 'admin'::app_role) THEN
    NEW.is_premium := OLD.is_premium;
    NEW.subscription_status := OLD.subscription_status;
    NEW.trial_course_id := OLD.trial_course_id;
    NEW.trial_start_date := OLD.trial_start_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS prevent_premium_self_grant_trigger ON public.profiles;
CREATE TRIGGER prevent_premium_self_grant_trigger
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_premium_self_grant();

-- 3. Fix lessons_public_read: drop blanket public read policies
DROP POLICY IF EXISTS "Allow read lessons" ON public.lessons;
DROP POLICY IF EXISTS "Allow read modules" ON public.modules;

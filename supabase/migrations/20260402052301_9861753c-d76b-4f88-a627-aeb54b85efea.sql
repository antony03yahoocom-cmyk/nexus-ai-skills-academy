
-- Fix can_access_course search path
CREATE OR REPLACE FUNCTION public.can_access_course(p_user_id uuid, p_course_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  is_free BOOLEAN;
  is_enrolled BOOLEAN;
BEGIN
  SELECT (price = 0) INTO is_free FROM courses WHERE id = p_course_id;
  IF is_free THEN RETURN TRUE; END IF;
  SELECT EXISTS (
    SELECT 1 FROM enrollments WHERE user_id = p_user_id AND course_id = p_course_id
  ) INTO is_enrolled;
  RETURN is_enrolled;
END;
$$;

-- Fix get_next_lesson search path
CREATE OR REPLACE FUNCTION public.get_next_lesson(p_user_id uuid, p_current_lesson uuid)
RETURNS TABLE(next_lesson_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_course_id UUID;
  v_next UUID;
BEGIN
  -- Get course from current lesson
  SELECT c.id INTO v_course_id
  FROM lessons l JOIN modules m ON m.id = l.module_id JOIN courses c ON c.id = m.course_id
  WHERE l.id = p_current_lesson;

  -- Get next lesson in global order
  WITH ordered AS (
    SELECT l.id as lid, ROW_NUMBER() OVER (ORDER BY m.sort_order, m.order_index, l.sort_order, l.order_index) as rn
    FROM lessons l JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id
  ),
  current_pos AS (
    SELECT rn FROM ordered WHERE lid = p_current_lesson
  )
  SELECT lid INTO v_next FROM ordered WHERE rn = (SELECT rn + 1 FROM current_pos) LIMIT 1;

  IF v_next IS NOT NULL THEN
    RETURN QUERY SELECT v_next;
  END IF;
END;
$$;

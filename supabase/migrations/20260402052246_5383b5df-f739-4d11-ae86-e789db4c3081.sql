
-- Fix can_access_lesson to work across modules sequentially
CREATE OR REPLACE FUNCTION public.can_access_lesson(p_user_id uuid, p_lesson_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_course_id UUID;
  v_global_index INT;
  v_prev_lesson_id UUID;
  v_prev_completed BOOLEAN;
  v_prev_assignment_approved BOOLEAN;
BEGIN
  -- Get course_id from lesson -> module -> course
  SELECT c.id INTO v_course_id
  FROM lessons l
  JOIN modules m ON m.id = l.module_id
  JOIN courses c ON c.id = m.course_id
  WHERE l.id = p_lesson_id;

  IF v_course_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Build ordered list and find this lesson's position
  -- Order: module sort_order, then lesson sort_order
  WITH ordered_lessons AS (
    SELECT l.id as lesson_id, 
           ROW_NUMBER() OVER (ORDER BY m.sort_order, m.order_index, l.sort_order, l.order_index) as rn
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id
  )
  SELECT rn INTO v_global_index
  FROM ordered_lessons
  WHERE lesson_id = p_lesson_id;

  -- First lesson is always accessible
  IF v_global_index = 1 THEN
    RETURN TRUE;
  END IF;

  -- Get previous lesson
  WITH ordered_lessons AS (
    SELECT l.id as lesson_id,
           ROW_NUMBER() OVER (ORDER BY m.sort_order, m.order_index, l.sort_order, l.order_index) as rn
    FROM lessons l
    JOIN modules m ON m.id = l.module_id
    WHERE m.course_id = v_course_id
  )
  SELECT lesson_id INTO v_prev_lesson_id
  FROM ordered_lessons
  WHERE rn = v_global_index - 1;

  IF v_prev_lesson_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Check previous lesson is completed
  SELECT EXISTS (
    SELECT 1 FROM lesson_completions
    WHERE user_id = p_user_id AND lesson_id = v_prev_lesson_id
  ) INTO v_prev_completed;

  IF NOT v_prev_completed THEN
    RETURN FALSE;
  END IF;

  -- Check previous lesson's assignment is approved (if any)
  SELECT NOT EXISTS (
    SELECT 1 FROM assignments a
    WHERE a.lesson_id = v_prev_lesson_id
    AND NOT EXISTS (
      SELECT 1 FROM submissions s
      WHERE s.assignment_id = a.id
      AND s.user_id = p_user_id
      AND s.status = 'Approved'
    )
  ) INTO v_prev_assignment_approved;

  RETURN v_prev_assignment_approved;
END;
$$;

-- Update has_course_access to handle free courses
CREATE OR REPLACE FUNCTION public.has_course_access(_user_id uuid, _course_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    -- User is admin
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) OR EXISTS (
    -- Course is free (price = 0) and user is enrolled
    SELECT 1 FROM public.courses c
    JOIN public.enrollments e ON e.course_id = c.id AND e.user_id = _user_id
    WHERE c.id = _course_id AND c.price = 0
  ) OR EXISTS (
    -- User is enrolled AND (has paid for course OR is premium)
    SELECT 1 FROM public.enrollments e
    WHERE e.user_id = _user_id AND e.course_id = _course_id
    AND (
      EXISTS (SELECT 1 FROM public.profiles p WHERE p.user_id = _user_id AND p.is_premium = true)
      OR EXISTS (SELECT 1 FROM public.course_purchases cp WHERE cp.user_id = _user_id AND cp.course_id = _course_id AND cp.status = 'paid')
      OR EXISTS (
        -- Active trial for this course
        SELECT 1 FROM public.profiles p 
        WHERE p.user_id = _user_id 
        AND p.trial_course_id = _course_id 
        AND p.trial_start_date + interval '7 days' > now()
      )
    )
  )
$$;

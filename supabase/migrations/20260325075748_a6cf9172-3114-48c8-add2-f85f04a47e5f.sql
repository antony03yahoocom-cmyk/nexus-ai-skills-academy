
-- Make course-content bucket private
UPDATE storage.buckets SET public = false WHERE id = 'course-content';

-- Make lesson-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'lesson-attachments';

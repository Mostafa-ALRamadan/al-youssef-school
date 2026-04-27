-- Drop all notification triggers, functions, and table
-- Run this to clean up before re-creating

-- Drop triggers first (they depend on functions)
DROP TRIGGER IF EXISTS notify_parent_on_grade ON grades;
DROP TRIGGER IF EXISTS notify_parent_on_absence ON attendance_records;
DROP TRIGGER IF EXISTS notify_parents_on_teacher_post ON teacher_posts;
DROP TRIGGER IF EXISTS notify_parents_on_announcement ON announcements;
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;

-- Drop functions (they depend on create_parent_notification, so drop in reverse order)
DROP FUNCTION IF EXISTS notify_on_grade();
DROP FUNCTION IF EXISTS notify_on_absence();
DROP FUNCTION IF EXISTS notify_on_teacher_post();
DROP FUNCTION IF EXISTS notify_on_announcement();
DROP FUNCTION IF EXISTS create_student_notification(UUID, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS create_parent_notification(UUID, TEXT, TEXT, TEXT);

-- Drop the notifications table (to recreate with correct foreign key if needed)
-- WARNING: This will delete all existing notifications!
DROP TABLE IF EXISTS notifications;

-- Verify they are dropped
SELECT 'All notification triggers, functions, and table dropped successfully' AS result;

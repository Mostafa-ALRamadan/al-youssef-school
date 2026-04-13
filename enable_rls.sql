-- Enable RLS on all tables
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Allow all" ON academic_years;
DROP POLICY IF EXISTS "Allow all" ON announcements;
DROP POLICY IF EXISTS "Allow all" ON classes;
DROP POLICY IF EXISTS "Allow all" ON exams;
DROP POLICY IF EXISTS "Allow all" ON grades;
DROP POLICY IF EXISTS "Allow all" ON parents;
DROP POLICY IF EXISTS "Allow all" ON payments;
DROP POLICY IF EXISTS "Allow all" ON semesters;
DROP POLICY IF EXISTS "Allow all" ON student_evaluations;
DROP POLICY IF EXISTS "Allow all" ON students;
DROP POLICY IF EXISTS "Allow all" ON subjects;
DROP POLICY IF EXISTS "Allow all" ON teachers;
DROP POLICY IF EXISTS "Allow all" ON teacher_assignments;
DROP POLICY IF EXISTS "Allow all" ON time_slots;
DROP POLICY IF EXISTS "Allow all" ON users;
DROP POLICY IF EXISTS "Allow all" ON weekly_schedule;
DROP POLICY IF EXISTS "Allow all" ON attendance_records;
DROP POLICY IF EXISTS "Allow all" ON attendance_sessions;
DROP POLICY IF EXISTS "Allow all" ON suggestions;

-- Create policies that allow all operations for now (you can restrict later)
-- These policies allow authenticated users to perform all operations
CREATE POLICY "Allow all" ON academic_years FOR ALL USING (true);
CREATE POLICY "Allow all" ON announcements FOR ALL USING (true);
CREATE POLICY "Allow all" ON classes FOR ALL USING (true);
CREATE POLICY "Allow all" ON exams FOR ALL USING (true);
CREATE POLICY "Allow all" ON grades FOR ALL USING (true);
CREATE POLICY "Allow all" ON parents FOR ALL USING (true);
CREATE POLICY "Allow all" ON payments FOR ALL USING (true);
CREATE POLICY "Allow all" ON semesters FOR ALL USING (true);
CREATE POLICY "Allow all" ON student_evaluations FOR ALL USING (true);
CREATE POLICY "Allow all" ON students FOR ALL USING (true);
CREATE POLICY "Allow all" ON subjects FOR ALL USING (true);
CREATE POLICY "Allow all" ON teachers FOR ALL USING (true);
CREATE POLICY "Allow all" ON teacher_assignments FOR ALL USING (true);
CREATE POLICY "Allow all" ON time_slots FOR ALL USING (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true);
CREATE POLICY "Allow all" ON weekly_schedule FOR ALL USING (true);
CREATE POLICY "Allow all" ON attendance_records FOR ALL USING (true);
CREATE POLICY "Allow all" ON attendance_sessions FOR ALL USING (true);
CREATE POLICY "Allow all" ON suggestions FOR ALL USING (true);

-- ============================================================================
-- مدرسة اليوسف للمتفوقين - نظام إدارة المدرسة
-- Al Youssef School - School Management System Database Schema
-- ============================================================================
-- Execute this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- 1. ENUMERATIONS / أنواع البيانات المخصصة
-- ============================================================================

-- Drop existing enums if they exist (for clean migration)
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS payment_type CASCADE;
DROP TYPE IF EXISTS day_of_week CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'teacher', 'parent');
CREATE TYPE payment_type AS ENUM ('school_fee', 'transport_fee', 'books_fee', 'uniform_fee', 'activity_fee', 'other');
CREATE TYPE day_of_week AS ENUM ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday');

-- ============================================================================
-- 2. USERS TABLE / جدول المستخدمين
-- ============================================================================
-- Note: This extends Supabase Auth users

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    role user_role NOT NULL DEFAULT 'parent',
    is_main_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE users IS 'Extended user information for the school system';
COMMENT ON COLUMN users.role IS 'User role: admin, teacher, or parent';
COMMENT ON COLUMN users.is_main_admin IS 'Whether this admin is the main/super admin with full privileges';

-- ============================================================================
-- 3. PARENTS TABLE / جدول أولياء الأمور
-- ============================================================================

CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT unique_parent_phone UNIQUE (phone)
);

COMMENT ON TABLE parents IS 'Parent information linked to user accounts';

-- ============================================================================
-- 4. CLASSES TABLE / جدول الصفوف الدراسية
-- ============================================================================

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE classes IS 'School classes and grade levels';

-- ============================================================================
-- 5. STUDENTS TABLE / جدول الطلاب
-- ============================================================================

CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    parent_id UUID REFERENCES parents(id) ON DELETE SET NULL,
    date_of_birth DATE,
    gender TEXT CHECK (gender IN ('male', 'female')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE students IS 'Student information linked to parents and classes';

-- ============================================================================
-- 6. TEACHERS TABLE / جدول المعلمين
-- ============================================================================

CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE teachers IS 'Teacher information linked to user accounts';

-- ============================================================================
-- 7. SUBJECTS TABLE / جدول المواد الدراسية
-- ============================================================================

CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE subjects IS 'School subjects and courses';

-- ============================================================================
-- 8. CLASS_SUBJECTS TABLE / جدول المواد لكل صف
-- ============================================================================

CREATE TABLE IF NOT EXISTS class_subjects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE CASCADE,
    UNIQUE(class_id, subject_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE class_subjects IS 'Subjects assigned to each class with teachers';

-- ============================================================================
-- 8.5. ACADEMIC YEARS TABLE / جدول السنوات الدراسية
-- ============================================================================

CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE academic_years IS 'Academic years for the school (e.g., 2024-2025)';

-- ============================================================================
-- 8.6. SEMESTERS TABLE / جدول الفصول الدراسية
-- ============================================================================

CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    start_date DATE,
    end_date DATE,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE semesters IS 'Semesters within academic years (e.g., Semester 1, Semester 2)';

-- ============================================================================
-- 9. ANNOUNCEMENTS TABLE / جدول الإعلانات
-- ============================================================================

CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    title TEXT NOT NULL,
    content TEXT NOT NULL,

    audience TEXT NOT NULL,

    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE announcements IS 'School announcements and notices';

-- ============================================================================
-- 10. EXAMS & GRADES TABLES / جداول الامتحانات والعلامات
-- ============================================================================

-- Create exams table
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    class_id UUID REFERENCES classes(id),
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(id),
    
    name TEXT NOT NULL,
    max_score INTEGER NOT NULL,
    
    exam_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE exams IS 'Exams created by teachers for classes';

-- Create grades table
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    exam_id UUID REFERENCES exams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),
    
    score NUMERIC NOT NULL,
    semester_id UUID REFERENCES semesters(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    
    CONSTRAINT unique_student_exam UNIQUE (exam_id, student_id)
);

COMMENT ON TABLE grades IS 'Student grades for each exam';

-- Create indexes for performance
CREATE INDEX idx_exams_class_id ON exams(class_id);
CREATE INDEX idx_exams_subject_id ON exams(subject_id);
CREATE INDEX idx_exams_teacher_id ON exams(teacher_id);
CREATE INDEX idx_exams_exam_date ON exams(exam_date);
CREATE INDEX idx_grades_exam_id ON grades(exam_id);
CREATE INDEX idx_grades_student_id ON grades(student_id);

-- ============================================================================
-- 11. TEACHER ASSIGNMENTS TABLE / جدول تعيين المعلمين
-- ============================================================================

CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT unique_teacher_assignment UNIQUE (teacher_id, subject_id, class_id)
);

COMMENT ON TABLE teacher_assignments IS 'Teacher assignments to classes and subjects';

-- ============================================================================
-- 13. PAYMENTS TABLE / جدول المدفوعات والأقساط
-- ============================================================================

CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    type payment_type NOT NULL DEFAULT 'school_fee',
    amount NUMERIC NOT NULL CHECK (amount > 0),
    paid_amount NUMERIC DEFAULT 0 CHECK (paid_amount >= 0),
    remaining_amount NUMERIC GENERATED ALWAYS AS (amount - paid_amount) STORED,
    due_date DATE,
    is_paid BOOLEAN GENERATED ALWAYS AS (paid_amount >= amount) STORED,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE payments IS 'Student fee payments and installments';

-- ============================================================================
-- 14. SCHEDULE TABLE / جدول البرنامج الأسبوعي
-- ============================================================================

CREATE TABLE IF NOT EXISTS schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id) ON DELETE SET NULL,
    day day_of_week NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    room TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    UNIQUE(class_id, day, start_time)
);

COMMENT ON TABLE schedule IS 'Weekly class schedule for all classes';

-- ============================================================================
-- 15. SUGGESTIONS TABLE / جدول الاقتراحات
-- ============================================================================

-- Drop existing table to recreate properly
DROP TABLE IF EXISTS suggestions CASCADE;

CREATE TABLE suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

-- Create indexes for performance
CREATE INDEX idx_suggestions_user_id ON suggestions(user_id);
CREATE INDEX idx_suggestions_created_at ON suggestions(created_at);

COMMENT ON TABLE suggestions IS 'Suggestions and feedback from parents/teachers';

-- ============================================================================
-- 16. SUBJECT_CONTENT TABLE / جدول محتوى المواد
-- ============================================================================

CREATE TABLE IF NOT EXISTS subject_content (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    file_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE subject_content IS 'Educational content uploaded by teachers';

-- ============================================================================
-- INDEXES FOR PERFORMANCE / الفهارس لتحسين الأداء
-- ============================================================================

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Parents indexes
CREATE INDEX IF NOT EXISTS idx_parents_user_id ON parents(user_id);
CREATE INDEX IF NOT EXISTS idx_parents_phone ON parents(phone);

-- Students indexes
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_parent_id ON students(parent_id);

-- Classes indexes
-- CREATE INDEX IF NOT EXISTS idx_classes_academic_year ON classes(academic_year);

-- Teachers indexes
CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- Subjects indexes
-- (no additional indexes needed for simplified schema)

-- Class subjects indexes
CREATE INDEX IF NOT EXISTS idx_class_subjects_class_id ON class_subjects(class_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON class_subjects(teacher_id);

-- Announcements indexes
CREATE INDEX IF NOT EXISTS idx_announcements_pinned ON announcements(is_pinned);
CREATE INDEX IF NOT EXISTS idx_announcements_active ON announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);

-- Attendance indexes
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(date);
CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_semester_id ON attendance_records(semester_id);

-- Student evaluations indexes
CREATE INDEX IF NOT EXISTS idx_student_evaluations_semester_id ON student_evaluations(semester_id);

-- Payments indexes
CREATE INDEX IF NOT EXISTS idx_payments_student_id ON payments(student_id);
CREATE INDEX IF NOT EXISTS idx_payments_type ON payments(type);
CREATE INDEX IF NOT EXISTS idx_payments_is_paid ON payments(is_paid);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON payments(due_date);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedule_class_id ON schedule(class_id);
CREATE INDEX IF NOT EXISTS idx_schedule_teacher_id ON schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_schedule_day ON schedule(day);
CREATE INDEX IF NOT EXISTS idx_schedule_class_day ON schedule(class_id, day);

-- Suggestions indexes
CREATE INDEX IF NOT EXISTS idx_suggestions_status ON suggestions(status);
CREATE INDEX IF NOT EXISTS idx_suggestions_created_at ON suggestions(created_at DESC);

-- Academic years and semesters indexes
CREATE INDEX IF NOT EXISTS idx_academic_years_active ON academic_years(is_active);
CREATE INDEX IF NOT EXISTS idx_semesters_year_id ON semesters(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_semesters_active ON semesters(is_active);

-- Subject content indexes
CREATE INDEX IF NOT EXISTS idx_subject_content_subject_id ON subject_content(subject_id);
CREATE INDEX IF NOT EXISTS idx_subject_content_teacher_id ON subject_content(teacher_id);
CREATE INDEX IF NOT EXISTS idx_subject_content_created_at ON subject_content(created_at DESC);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES / سياسات أمان الصفوف
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE class_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE academic_years ENABLE ROW LEVEL SECURITY;
ALTER TABLE semesters ENABLE ROW LEVEL SECURITY;
ALTER TABLE suggestions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subject_content ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES / سياسات الأمان
-- ============================================================================

-- USERS: Everyone can read, only admins can modify
CREATE POLICY "Users are viewable by authenticated users"
ON users FOR SELECT
TO authenticated
USING (true);

-- PARENTS: Parents can view own data, teachers/admins can view all
CREATE POLICY "Parents can view own data"
ON parents FOR SELECT
TO authenticated
USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

CREATE POLICY "Parents can update own data"
ON parents FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- STUDENTS: Parents can view own children, teachers/admins can view all
CREATE POLICY "Students viewable by related users"
ON students FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM parents p WHERE p.id = students.parent_id AND p.user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- TEACHERS: Public read, self update
CREATE POLICY "Teachers are viewable by authenticated users"
ON teachers FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Teachers can update own data"
ON teachers FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- CLASSES: Public read, admin write
CREATE POLICY "Classes are viewable by authenticated users"
ON classes FOR SELECT
TO authenticated
USING (true);

-- SUBJECTS: Public read
CREATE POLICY "Subjects are viewable by authenticated users"
ON subjects FOR SELECT
TO authenticated
USING (true);

-- CLASS_SUBJECTS: Public read
CREATE POLICY "Class subjects are viewable by authenticated users"
ON class_subjects FOR SELECT
TO authenticated
USING (true);

-- ANNOUNCEMENTS: Public read
CREATE POLICY "Announcements are viewable by authenticated users"
ON announcements FOR SELECT
TO authenticated
USING (is_active = true);

-- ATTENDANCE: Teachers/admins can read/write, parents read own children
CREATE POLICY "Attendance viewable by related users"
ON attendance FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN parents p ON s.parent_id = p.id
        WHERE s.id = attendance.student_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- GRADES: Teachers/admins can read/write, parents read own children
CREATE POLICY "Grades viewable by related users"
ON grades FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN parents p ON s.parent_id = p.id
        WHERE s.id = grades.student_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- PAYMENTS: Parents can view own children payments
CREATE POLICY "Payments viewable by related users"
ON payments FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM students s
        JOIN parents p ON s.parent_id = p.id
        WHERE s.id = payments.student_id AND p.user_id = auth.uid()
    ) OR
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'teacher'))
);

-- SCHEDULE: Public read
CREATE POLICY "Schedule is viewable by authenticated users"
ON schedule FOR SELECT
TO authenticated
USING (true);

-- ACADEMIC YEARS: Admins can manage, everyone can view
CREATE POLICY "Academic years viewable by authenticated users"
ON academic_years FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Academic years manageable by admins only"
ON academic_years FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- SEMESTERS: Admins can manage, everyone can view
CREATE POLICY "Semesters viewable by authenticated users"
ON semesters FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Semesters manageable by admins only"
ON semesters FOR ALL
TO authenticated
USING (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'))
WITH CHECK (EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'));

-- SUGGESTIONS: Anyone can create, admins can view/manage
CREATE POLICY "Suggestions are viewable by admins"
ON suggestions FOR SELECT
TO authenticated
USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin') OR
    (is_anonymous = false AND sender_email = (SELECT email FROM users WHERE id = auth.uid()))
);

CREATE POLICY "Anyone can create suggestions"
ON suggestions FOR INSERT
TO authenticated
WITH CHECK (true);

-- SUBJECT_CONTENT: Public read
CREATE POLICY "Subject content is viewable by authenticated users"
ON subject_content FOR SELECT
TO authenticated
USING (is_active = true);

-- ============================================================================
-- FUNCTIONS & TRIGGERS / الدوال والمحفزات
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc', now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update trigger to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_parents_updated_at BEFORE UPDATE ON parents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subjects_updated_at BEFORE UPDATE ON subjects
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_grades_updated_at BEFORE UPDATE ON grades
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- TIME SLOTS / الفترات الزمنية
-- ============================================================================

CREATE TABLE time_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),

    CONSTRAINT valid_time_range CHECK (end_time > start_time),
    CONSTRAINT unique_time_slot UNIQUE (start_time, end_time)
);

CREATE TRIGGER update_time_slots_updated_at BEFORE UPDATE ON time_slots
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- WEEKLY SCHEDULE / البرنامج الأسبوعي
-- ============================================================================

CREATE TABLE weekly_schedule (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID REFERENCES subjects(id),
    teacher_id UUID REFERENCES teachers(id),

    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),

    CONSTRAINT valid_time_range CHECK (end_time > start_time)
);

-- Prevent class overlap: A class cannot have two lessons at the same time
ALTER TABLE weekly_schedule
ADD CONSTRAINT unique_class_time
UNIQUE (class_id, day_of_week, start_time);

-- Prevent teacher overlap: Teacher cannot teach two classes at same time
ALTER TABLE weekly_schedule
ADD CONSTRAINT unique_teacher_time
UNIQUE (teacher_id, day_of_week, start_time);

CREATE TRIGGER update_schedule_updated_at BEFORE UPDATE ON schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suggestions_updated_at BEFORE UPDATE ON suggestions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subject_content_updated_at BEFORE UPDATE ON subject_content
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_schedule_updated_at BEFORE UPDATE ON weekly_schedule
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ATTENDANCE / التفقد اليومي
-- ============================================================================

-- Table 1: attendance_sessions
-- Represents one lesson attendance session
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    schedule_id UUID REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),

    -- Only one attendance session per schedule per day
    CONSTRAINT unique_attendance_session UNIQUE (schedule_id, date)
);

-- Table 2: attendance_records
-- Each student's attendance status
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id),

    status TEXT NOT NULL,

    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    semester_id UUID REFERENCES semesters(id),
    -- Only one record per student per session
    CONSTRAINT unique_student_attendance UNIQUE (session_id, student_id),

    -- Validate status values
    CONSTRAINT valid_attendance_status CHECK (status IN ('present', 'absent', 'late', 'excused'))
);

-- Triggers for updated_at
CREATE TRIGGER update_attendance_sessions_updated_at BEFORE UPDATE ON attendance_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SAMPLE DATA / بيانات تجريبية (اختياري)
-- ============================================================================

-- Uncomment to insert sample data:

-- -- Insert sample users
-- INSERT INTO users (email, role) VALUES
-- ('admin@alyoussef.edu', 'admin'),
-- ('teacher1@alyoussef.edu', 'teacher'),
-- ('parent1@alyoussef.edu', 'parent');

-- -- Insert sample classes
-- INSERT INTO classes (name) VALUES
-- ('الصف الأول - أ'),
-- ('الصف الثاني - أ'),
-- ('الصف الثالث - أ');

-- -- Insert sample subjects
-- INSERT INTO subjects (name, description) VALUES
-- ('الرياضيات', 'مادة الرياضيات'),
-- ('اللغة العربية', 'مادة اللغة العربية'),
-- ('العلوم', 'مادة العلوم العامة'),
-- ('اللغة الإنجليزية', 'مادة اللغة الإنجليزية');

-- ============================================================================
-- 15. STUDENT EVALUATIONS TABLE / جدول تقييم الطلاب
-- ============================================================================

CREATE TABLE IF NOT EXISTS student_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id),
    
    behavior_rating INTEGER,
    participation_rating INTEGER,
    homework_rating INTEGER,
    
    notes TEXT,
    semester_id UUID REFERENCES semesters(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

COMMENT ON TABLE student_evaluations IS 'Student behavioral and participation evaluations by teachers';
COMMENT ON COLUMN student_evaluations.behavior_rating IS 'Rating from 1 (ضعيف) to 5 (ممتاز)';
COMMENT ON COLUMN student_evaluations.participation_rating IS 'Rating from 1 (ضعيف) to 5 (ممتاز)';
COMMENT ON COLUMN student_evaluations.homework_rating IS 'Rating from 1 (ضعيف) to 5 (ممتاز)';

-- Create indexes for better performance
CREATE INDEX idx_student_evaluations_student_id ON student_evaluations(student_id);
CREATE INDEX idx_student_evaluations_teacher_id ON student_evaluations(teacher_id);
CREATE INDEX idx_student_evaluations_created_at ON student_evaluations(created_at);

-- ============================================================================
-- END OF MIGRATION / نهاية الهجرة
-- ============================================================================

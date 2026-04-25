-- PostgreSQL Schema for Al-Youssef School Management System
-- Complete database structure for self-hosted PostgreSQL

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ACADEMIC YEARS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS academic_years (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_academic_years_is_active ON academic_years(is_active);

-- ============================================================================
-- 2. SEMESTERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_semesters_academic_year ON semesters(academic_year_id);

-- ============================================================================
-- 3. CLASSES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 4. SUBJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subjects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 5. USERS TABLE (Teachers & Admins)
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher')),
    phone VARCHAR(20),
    is_main_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    active_session_id UUID
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- ============================================================================
-- 6. TEACHERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    subject_id UUID REFERENCES subjects(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_teachers_user_id ON teachers(user_id);

-- ============================================================================
-- 7. PARENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS parents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    auth_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_parents_auth_email ON parents(auth_email);

-- ============================================================================
-- 8. STUDENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    login_name VARCHAR(50) UNIQUE NOT NULL,
    class_id UUID NOT NULL REFERENCES classes(id),
    parent_id UUID NOT NULL REFERENCES parents(id),
    date_of_birth DATE,
    gender VARCHAR(10) CHECK (gender IN ('male', 'female')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_login_name ON students(login_name);
CREATE INDEX IF NOT EXISTS idx_students_class_id ON students(class_id);

-- ============================================================================
-- 9. EXAMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS exams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id),
    subject_id UUID NOT NULL REFERENCES subjects(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    name VARCHAR(200) NOT NULL,
    exam_date DATE NOT NULL,
    max_score INTEGER DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_exams_class_id ON exams(class_id);
CREATE INDEX IF NOT EXISTS idx_exams_subject_id ON exams(subject_id);
CREATE INDEX IF NOT EXISTS idx_exams_semester_id ON exams(semester_id);

-- ============================================================================
-- 10. GRADES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    exam_id UUID NOT NULL REFERENCES exams(id),
    semester_id UUID NOT NULL REFERENCES semesters(id),
    score INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_grades_student_id ON grades(student_id);
CREATE INDEX IF NOT EXISTS idx_grades_exam_id ON grades(exam_id);
CREATE INDEX IF NOT EXISTS idx_grades_semester_id ON grades(semester_id);
CREATE INDEX IF NOT EXISTS idx_grades_updated_at ON grades(updated_at);

-- ============================================================================
-- 11. TIME SLOTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS time_slots (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 12. ATTENDANCE SESSIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    schedule_id UUID NOT NULL REFERENCES weekly_schedule(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_sessions_schedule_id ON attendance_sessions(schedule_id);
CREATE INDEX IF NOT EXISTS idx_attendance_sessions_date ON attendance_sessions(date);

-- ============================================================================
-- 13. ATTENDANCE RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS attendance_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'excused')),
    semester_id UUID REFERENCES semesters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attendance_records_session_id ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_student_id ON attendance_records(student_id);

-- ============================================================================
-- 14. ANNOUNCEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    audience VARCHAR(20) DEFAULT 'all',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT announcements_audience_check CHECK (audience IN ('all', 'teachers', 'parents'))
);

-- ============================================================================
-- 15. STUDENT FEES TABLE (نظام الأقساط)
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_fees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES academic_years(id),
    school_fee NUMERIC NOT NULL DEFAULT 0,
    transport_fee NUMERIC NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT unique_student_year_fee UNIQUE (student_id, academic_year_id)
);

CREATE INDEX IF NOT EXISTS idx_student_fees_student_id ON student_fees(student_id);
CREATE INDEX IF NOT EXISTS idx_student_fees_academic_year_id ON student_fees(academic_year_id);

-- ============================================================================
-- 16. FEE PAYMENTS TABLE (تفاصيل الدفعات)
-- ============================================================================
CREATE TABLE IF NOT EXISTS fee_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_fee_id UUID NOT NULL REFERENCES student_fees(id) ON DELETE CASCADE,
    amount NUMERIC NOT NULL CHECK (amount > 0),
    payment_date DATE DEFAULT CURRENT_DATE,
    payment_method TEXT DEFAULT 'cash',
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now()),
    CONSTRAINT payment_method_check CHECK (payment_method IN ('cash', 'bank', 'online'))
);

CREATE INDEX IF NOT EXISTS idx_fee_payments_student_fee_id ON fee_payments(student_fee_id);
CREATE INDEX IF NOT EXISTS idx_fee_payments_payment_date ON fee_payments(payment_date);

-- ============================================================================
-- 17. COMPLAINTS TABLE
-- ============================================================================
CREATE TABLE complaints (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id UUID NOT NULL REFERENCES parents(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
    reply TEXT,
    replied_at TIMESTAMP WITH TIME ZONE,
    replied_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_complaints_status ON complaints(status);
CREATE INDEX IF NOT EXISTS idx_complaints_parent_id ON complaints(parent_id);

-- ============================================================================
-- 18. STUDENT EVALUATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS student_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES students(id),
    teacher_id UUID NOT NULL REFERENCES teachers(id),
    behavior_rating INTEGER CHECK (behavior_rating >= 1 AND behavior_rating <= 5),
    participation_rating INTEGER CHECK (participation_rating >= 1 AND participation_rating <= 5),
    homework_rating INTEGER CHECK (homework_rating >= 1 AND homework_rating <= 5),
    notes TEXT,
    semester_id UUID REFERENCES semesters(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_evaluations_student_id ON student_evaluations(student_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_teacher_id ON student_evaluations(teacher_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_semester_id ON student_evaluations(semester_id);

-- ============================================================================
-- 19. CLASS TOP STUDENTS TABLE (Stars of the Year)
-- ============================================================================
CREATE TABLE IF NOT EXISTS class_top_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
    academic_year_id UUID NOT NULL REFERENCES academic_years(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position IN (1, 2, 3)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_class_year_position UNIQUE (class_id, academic_year_id, position),
    CONSTRAINT unique_class_year_student UNIQUE (class_id, academic_year_id, student_id)
);

CREATE INDEX IF NOT EXISTS idx_class_top_students_class_id ON class_top_students(class_id);
CREATE INDEX IF NOT EXISTS idx_class_top_students_academic_year_id ON class_top_students(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_class_top_students_student_id ON class_top_students(student_id);

-- ============================================================================
-- 20. TEACHER ASSIGNMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_teacher_class_subject UNIQUE (teacher_id, class_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_id ON teacher_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id ON teacher_assignments(class_id);

-- ============================================================================
-- 21. WEEKLY SCHEDULE TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS weekly_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7), -- 1=Sunday, 6=Friday, 7=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_weekly_schedule_teacher_id ON weekly_schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_weekly_schedule_class_id ON weekly_schedule(class_id);

-- ============================================================================
-- 22. NEWS TABLE (School News)
-- ============================================================================
CREATE TABLE IF NOT EXISTS news (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    summary TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    is_published BOOLEAN DEFAULT true,
    is_pinned BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_news_is_published ON news(is_published);
CREATE INDEX IF NOT EXISTS idx_news_is_pinned ON news(is_pinned);
CREATE INDEX IF NOT EXISTS idx_news_created_at ON news(created_at);

CREATE TRIGGER update_news_updated_at BEFORE UPDATE ON news FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();


-- ============================================================================
-- 23. TEACHER POSTS TABLE (منشورات المعلمين)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teacher_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES teachers(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    subject_id UUID NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id),
    title TEXT,
    content TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc', now())
);

CREATE INDEX IF NOT EXISTS idx_teacher_posts_teacher_id ON teacher_posts(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_class_id ON teacher_posts(class_id);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_semester_id ON teacher_posts(semester_id);
CREATE INDEX IF NOT EXISTS idx_teacher_posts_created_at ON teacher_posts(created_at DESC);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_academic_years_updated_at BEFORE UPDATE ON academic_years FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_classes_updated_at BEFORE UPDATE ON classes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_teachers_updated_at BEFORE UPDATE ON teachers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_complaints_updated_at BEFORE UPDATE ON complaints FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_class_top_students_updated_at BEFORE UPDATE ON class_top_students FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_attendance_records_updated_at BEFORE UPDATE ON attendance_records FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
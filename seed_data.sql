-- ============================================================================
-- SEED DATA FOR TESTING / بيانات تجريبية للاختبار
-- ============================================================================
-- Run this after creating the schema to populate test data
-- ============================================================================

-- ============================================================================
-- 1. CREATE TEST USERS IN SUPABASE AUTH (Manually or via Supabase Dashboard)
-- ============================================================================
-- Note: Users must be created in Supabase Auth first, then sync to users table
-- Or use Supabase Dashboard > Authentication > Add User

-- After creating auth users, run this to sync:

-- Insert admin user (replace with actual auth user UUID)
INSERT INTO users (id, email, role) VALUES
('dcd63359-1aca-4f71-b004-e9ab8ae8669a', 'admin@alyoussef.edu', 'admin');

-- Insert teacher users
INSERT INTO users (id, email, role) VALUES
('0649a08b-886d-4d61-b865-c9a056ea93c4', 'teacher1@alyoussef.edu', 'teacher'),
('61822c4a-23eb-46fe-a882-450afe1c2f7d', 'teacher2@alyoussef.edu', 'teacher');

-- Insert parent users
INSERT INTO users (id, email, role) VALUES
('ab2c42c0-07ee-4aff-81d9-0dabb4137e0a', 'parent1@alyoussef.edu', 'parent'),
('471e5951-7ab0-4e80-84dc-b4b5e3cedae4', 'parent2@alyoussef.edu', 'parent'),
('d6205e57-d5d8-48db-9eb3-bb863ace752b', 'parent3@alyoussef.edu', 'parent');

-- ============================================================================
-- 2. CREATE PARENTS
-- ============================================================================
INSERT INTO parents (user_id, name, phone, address) VALUES
('ab2c42c0-07ee-4aff-81d9-0dabb4137e0a', 'خالد العبدالله', '0501234567', 'حي الروضة، الرياض'),
('471e5951-7ab0-4e80-84dc-b4b5e3cedae4', 'فاطمة الزهراء', '0502345678', 'حي النزهة، الرياض'),
('d6205e57-d5d8-48db-9eb3-bb863ace752b', 'محمد السالم', '0503456789', 'حي الغدير، الرياض');

-- ============================================================================
-- 3. CREATE CLASSES
-- ============================================================================
INSERT INTO classes (name, academic_year) VALUES
('الصف الأول', '2024-2025'),
('الصف الثاني', '2024-2025'),
('الصف الثالث', '2024-2025');

-- ============================================================================
-- 4. CREATE TEACHERS
-- ============================================================================
INSERT INTO teachers (user_id, name, specialization, phone) VALUES
('0649a08b-886d-4d61-b865-c9a056ea93c4', 'أحمد العلي', 'الرياضيات', '0501111111'),
('61822c4a-23eb-46fe-a882-450afe1c2f7d', 'سارة محمد', 'اللغة العربية', '0502222222');

-- ============================================================================
-- 5. CREATE SUBJECTS
-- ============================================================================
INSERT INTO subjects (name, description) VALUES
('الرياضيات', 'مادة الرياضيات الأساسية'),
('اللغة العربية', 'مادة اللغة العربية'),
('العلوم', 'مادة العلوم العامة'),
('اللغة الإنجليزية', 'مادة اللغة الإنجليزية'),
('التربية الإسلامية', 'مادة التربية الإسلامية'),
('الدراسات الاجتماعية', 'مادة الدراسات الاجتماعية');

-- ============================================================================
-- 6. CREATE STUDENTS
-- ============================================================================
INSERT INTO students (name, student_code, class_id, parent_id, date_of_birth, gender) VALUES
('عمر خالد العبدالله', 'STU001', (SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM parents WHERE name = 'خالد العبدالله'), '2018-01-15', 'male'),
('ليان خالد العبدالله', 'STU002', (SELECT id FROM classes WHERE name = 'الصف الثاني - أ'), (SELECT id FROM parents WHERE name = 'خالد العبدالله'), '2017-03-20', 'female'),
('نورا فاطمة الزهراء', 'STU003', (SELECT id FROM classes WHERE name = 'الصف الأول - ب'), (SELECT id FROM parents WHERE name = 'فاطمة الزهراء'), '2018-05-10', 'female'),
('يوسف محمد السالم', 'STU004', (SELECT id FROM classes WHERE name = 'الصف الثالث - أ'), (SELECT id FROM parents WHERE name = 'محمد السالم'), '2016-08-25', 'male'),
('سارة محمد السالم', 'STU005', (SELECT id FROM classes WHERE name = 'الصف الثاني - ب'), (SELECT id FROM parents WHERE name = 'محمد السالم'), '2017-11-12', 'female');

-- ============================================================================
-- 7. ASSIGN SUBJECTS TO CLASSES
-- ============================================================================
INSERT INTO class_subjects (class_id, subject_id, teacher_id) VALUES
-- Class 1-A
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي')),
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد')),
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'العلوم'), (SELECT id FROM teachers WHERE name = 'أحمد العلي')),

-- Class 1-B
((SELECT id FROM classes WHERE name = 'الصف الأول - ب'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي')),
((SELECT id FROM classes WHERE name = 'الصف الأول - ب'), (SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد'));

-- ============================================================================
-- 8. CREATE SCHEDULE
-- ============================================================================
INSERT INTO schedule (class_id, subject_id, teacher_id, day, start_time, end_time, room) VALUES
-- Sunday - Class 1-A
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 'sunday', '08:00', '09:30', '101'),
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 'sunday', '09:45', '11:15', '101'),

-- Monday - Class 1-A
((SELECT id FROM classes WHERE name = 'الصف الأول - أ'), (SELECT id FROM subjects WHERE name = 'العلوم'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 'monday', '08:00', '09:30', '101'),

-- Sunday - Class 2-A
((SELECT id FROM classes WHERE name = 'الصف الثاني - أ'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 'sunday', '11:30', '13:00', '201');

-- ============================================================================
-- 9. CREATE ANNOUNCEMENTS
-- ============================================================================
INSERT INTO announcements (title, content, target_audience, is_pinned, author_id) VALUES
('بدء العام الدراسي الجديد', 'نرحب بجميع الطلاب في العام الدراسي 2024-2025', ARRAY['all'], true, (SELECT id FROM users WHERE email = 'admin@alyoussef.edu')),
('اجتماع أولياء الأمور', 'سيتم عقد اجتماع أولياء الأمور يوم الخميس القادم الساعة 5 مساءً', ARRAY['parents'], false, (SELECT id FROM users WHERE email = 'admin@alyoussef.edu')),
('تأجيل الامتحانات', 'تم تأجيل الامتحانات النصفية إلى الأسبوع القادم', ARRAY['all'], true, (SELECT id FROM users WHERE email = 'admin@alyoussef.edu'));

-- ============================================================================
-- 10. CREATE ATTENDANCE RECORDS
-- ============================================================================
INSERT INTO attendance (student_id, date, present, note) VALUES
((SELECT id FROM students WHERE student_code = 'STU001'), CURRENT_DATE, true, NULL),
((SELECT id FROM students WHERE student_code = 'STU002'), CURRENT_DATE, true, NULL),
((SELECT id FROM students WHERE student_code = 'STU003'), CURRENT_DATE, false, 'غائب بعذر'),
((SELECT id FROM students WHERE student_code = 'STU004'), CURRENT_DATE, true, NULL),
((SELECT id FROM students WHERE student_code = 'STU005'), CURRENT_DATE, true, NULL);

-- ============================================================================
-- 11. CREATE GRADES
-- ============================================================================
INSERT INTO grades (student_id, subject_id, teacher_id, grade, exam_type, note) VALUES
((SELECT id FROM students WHERE student_code = 'STU001'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 95, 'quiz', 'أداء ممتاز'),
((SELECT id FROM students WHERE student_code = 'STU001'), (SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 88, 'quiz', 'جيد جداً'),
((SELECT id FROM students WHERE student_code = 'STU002'), (SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 92, 'midterm', NULL),
((SELECT id FROM students WHERE student_code = 'STU003'), (SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 78, 'quiz', 'يحتاج لمزيد من التمرين'),
((SELECT id FROM students WHERE student_code = 'STU004'), (SELECT id FROM subjects WHERE name = 'العلوم'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 96, 'final', 'ممتاز');

-- ============================================================================
-- 12. CREATE PAYMENTS
-- ============================================================================
INSERT INTO payments (student_id, type, amount, paid_amount, due_date, description) VALUES
((SELECT id FROM students WHERE student_code = 'STU001'), 'school_fee', 5000, 5000, '2024-09-01', 'القسط الأول - تم الدفع'),
((SELECT id FROM students WHERE student_code = 'STU002'), 'school_fee', 5000, 2500, '2024-09-01', 'القسط الأول - دفع جزئي'),
((SELECT id FROM students WHERE student_code = 'STU002'), 'transport_fee', 2000, 0, '2024-09-15', 'مواصلات - غير مدفوع'),
((SELECT id FROM students WHERE student_code = 'STU003'), 'school_fee', 5000, 5000, '2024-09-01', 'القسط الأول - تم الدفع'),
((SELECT id FROM students WHERE student_code = 'STU004'), 'school_fee', 5000, 5000, '2024-09-01', 'القسط الأول - تم الدفع'),
((SELECT id FROM students WHERE student_code = 'STU005'), 'school_fee', 5000, 0, '2024-09-01', 'القسط الأول - غير مدفوع');

-- ============================================================================
-- 13. CREATE SUGGESTIONS
-- ============================================================================
INSERT INTO suggestions (message, sender_name, sender_type, status) VALUES
('أقترح إضافة نشاط رياضي إضافي للطلاب', 'ولي أمر', 'parent', 'pending'),
('نحتاج إلى تحديث المكتبة المدرسية', 'معلم', 'teacher', 'reviewed'),
('أرجو زيادة عدد الحصص الرياضية', 'ولي أمر', 'parent', 'pending');

-- ============================================================================
-- 14. CREATE SUBJECT CONTENT
-- ============================================================================
INSERT INTO subject_content (subject_id, teacher_id, title, content, image_url) VALUES
((SELECT id FROM subjects WHERE name = 'الرياضيات'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 'درس: الجمع والطرح', 'شرح مفصل لعمليتي الجمع والطرح للصف الأول...', 'https://example.com/math-lesson-1.jpg'),
((SELECT id FROM subjects WHERE name = 'اللغة العربية'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 'درس: الحروف الهجائية', 'شرح الحروف الهجائية مع أمثلة...', NULL);

-- ============================================================================
-- 15. CREATE EVALUATIONS
-- ============================================================================
INSERT INTO evaluations (student_id, teacher_id, evaluation_type, score, comment) VALUES
((SELECT id FROM students WHERE student_code = 'STU001'), (SELECT id FROM teachers WHERE name = 'أحمد العلي'), 'behavior', 5, 'سلوك ممتاز وانضباط عالٍ'),
((SELECT id FROM students WHERE student_code = 'STU002'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 'participation', 4, 'يشارك بفعالية في الحصص'),
((SELECT id FROM students WHERE student_code = 'STU003'), (SELECT id FROM teachers WHERE name = 'سارة محمد'), 'effort', 3, 'يحتاج لبذل المزيد من الجهد');

-- ============================================================================
-- END OF SEED DATA / نهاية البيانات التجريبية
-- ============================================================================

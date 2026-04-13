export type UserRole = 'admin' | 'teacher' | 'parent';
export type PaymentType = 'school_fee' | 'transport_fee' | 'books_fee' | 'uniform_fee' | 'activity_fee' | 'other';
export type DayOfWeek = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';
export type EvaluationType = 'behavior' | 'participation' | 'effort' | 'attitude' | 'other';
export type ExamType = 'quiz' | 'homework' | 'midterm' | 'final' | 'project';
export type SenderType = 'parent' | 'teacher' | 'student' | 'other';
export type SuggestionStatus = 'pending' | 'reviewed' | 'implemented' | 'rejected';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  is_main_admin?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Parent {
  id: string;
  user_id: string;
  name: string;
  phone: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  user_id: string;
  name: string;
  email?: string;
  phone?: string;
  subject_id?: string;
  subject_name?: string;
  class_id?: string;
  class_name?: string;
  created_at: string;
  updated_at: string;
}

export interface Class {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface Student {
  id: string;
  name: string;
  class_id?: string;
  parent_id?: string;
  date_of_birth?: string;
  gender?: 'male' | 'female';
  created_at: string;
  updated_at: string;
  // Joined data for UI display
  class_name?: string;
  parent_name?: string;
  parent_email?: string;
  parent_phone?: string;
  parent_address?: string;
}

export interface Subject {
  id: string;
  name: string;
  created_at: string;
  updated_at: string;
}

export interface ClassSubject {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  created_at: string;
}


export interface TeacherAssignment {
  id: string;
  teacher_id: string;
  subject_id: string;
  class_id: string;
  created_at: string;
  // Joined data for UI display
  teacher_name?: string;
  subject_name?: string;
  class_name?: string;
}

export interface WeeklySchedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  created_at: string;
  // Joined data for display
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

export interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface AttendanceSession {
  id: string;
  schedule_id: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface AttendanceRecord {
  id: string;
  session_id: string;
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  created_at: string;
  updated_at: string;
  student_name?: string;
}

export interface LessonAttendance {
  schedule_id: string;
  session_id: string | null;
  subject_name: string;
  teacher_name: string;
  start_time: string;
  end_time: string;
  has_attendance: boolean;
  records: AttendanceRecord[];
}

export interface Payment {
  id: string;
  student_id: string;
  type: PaymentType;
  amount: number;
  paid_amount: number;
  remaining_amount: number;
  due_date?: string;
  is_paid: boolean;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface Schedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id?: string;
  day: DayOfWeek;
  start_time: string;
  end_time: string;
  room?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SubjectContent {
  id: string;
  subject_id: string;
  teacher_id: string;
  title: string;
  content: string;
  image_url?: string;
  file_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  attendanceRate: number;
  pendingPayments: number;
  newSuggestions: number;
}

// Grades System Types
export interface Exam {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  name: string;
  max_score: number;
  exam_date: string;
  created_at: string;
  // Optional joined fields
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
  semester_name?: string;
}

export interface Grade {
  id: string;
  exam_id: string;
  student_id: string;
  score: number;
  semester_id?: string;
  created_at: string;
  // Optional joined fields
  student_name?: string;
  exam_name?: string;
  max_score?: number;
  subject_name?: string;
  semester_name?: string;
  academic_year_name?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: 'all' | 'teachers' | 'parents';
  created_by: string;
  created_at: string;
  // Optional joined fields
  created_by_name?: string;
}

export interface Suggestion {
  id: string;
  user_id?: string;
  title: string;
  message: string;
  status: 'pending' | 'reviewed' | 'implemented' | 'rejected';
  created_at: string;
  // Reply fields
  reply?: string;
  replied_at?: string;
  replied_by?: string;
  // Optional joined fields
  user_name?: string;
  user_email?: string;
}

export interface StudentEvaluation {
  id: string;
  student_id: string;
  teacher_id: string;
  behavior_rating: number;
  participation_rating: number;
  homework_rating: number;
  notes?: string;
  created_at: string;
  // Optional joined fields
  student_name?: string;
  teacher_name?: string;
  class_name?: string;
}

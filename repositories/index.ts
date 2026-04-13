import { supabase } from '@/lib/supabase-server';
import type {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  Announcement,
  Payment,
  Schedule,
  Suggestion,
  DashboardStats,
  Parent,
  TeacherAssignment,
  WeeklySchedule,
  TimeSlot,
  AttendanceSession,
  AttendanceRecord,
  LessonAttendance,
  Exam,
  Grade,
} from '@/types';

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error) return null;
    return data as User;
  }

  static async findById(id: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as User;
  }

  static async create(user: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .insert(user)
      .select()
      .single();
    
    if (error) return null;
    return data as User;
  }

  static async update(id: string, updates: Partial<User>): Promise<User | null> {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as User;
  }
}

export class StudentRepository {
  static async findAll(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes(name),
        parents(name, phone, address, user_id)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Student findAll error:', error);
      return [];
    }
    
    // Get unique user_ids from parents to fetch emails
    const userIds = [...new Set((data || []).map((s: any) => s.parents?.user_id).filter(Boolean))];
    
    let userEmails: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);
      
      if (!usersError && usersData) {
        userEmails = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]));
      }
    }
    
    // Transform the nested data to flat structure
    return (data || []).map((student: any) => ({
      ...student,
      class_name: student.classes?.name,
      parent_name: student.parents?.name,
      parent_email: userEmails[student.parents?.user_id],
      parent_phone: student.parents?.phone,
      parent_address: student.parents?.address,
    })) as unknown as Student[];
  }

  static async findById(id: string): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes!inner(name),
        parents!inner(name) as parent_name,
        parents!inner(phone) as parent_phone
      `)
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as unknown as Student;
  }

  static async findByClassId(classId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('class_id', classId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Student[];
  }

  static async findByParentId(parentId: string): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parentId)
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Student[];
  }

  static async findByClassIds(classIds: string[]): Promise<Student[]> {
    if (classIds.length === 0) return [];
    
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        classes(name),
        parents(name, phone, address, user_id)
      `)
      .in('class_id', classIds)
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('Student findByClassIds error:', error);
      return [];
    }
    
    // Get unique user_ids from parents to fetch emails
    const userIds = [...new Set((data || []).map((s: any) => s.parents?.user_id).filter(Boolean))];
    
    let userEmails: Record<string, string> = {};
    if (userIds.length > 0) {
      const { data: usersData, error: usersError } = await supabase
        .from('users')
        .select('id, email')
        .in('id', userIds);
      
      if (!usersError && usersData) {
        userEmails = Object.fromEntries(usersData.map((u: any) => [u.id, u.email]));
      }
    }
    
    // Transform the nested data to flat structure
    return (data || []).map((student: any) => ({
      ...student,
      class_name: student.classes?.name,
      parent_name: student.parents?.name,
      parent_email: userEmails[student.parents?.user_id],
      parent_phone: student.parents?.phone,
      parent_address: student.parents?.address,
    })) as unknown as Student[];
  }

  static async create(student: Partial<Student>): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .insert(student)
      .select()
      .single();
    
    if (error) return null;
    return data as Student;
  }

  static async update(id: string, updates: Partial<Student>): Promise<Student | null> {
    const { data, error } = await supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as Student;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    return count || 0;
  }
}

export class ParentRepository {
  static async findAll(): Promise<Parent[]> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Parent[];
  }

  static async findById(id: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Parent;
  }

  static async findByPhone(phone: string): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .select('*')
      .eq('phone', phone)
      .single();
    
    if (error) return null;
    return data as Parent;
  }

  static async create(
    parent: Omit<Parent, 'id' | 'user_id' | 'created_at' | 'updated_at'>,
    email: string,
    password: string,
    existingUserId?: string
  ): Promise<Parent | null> {
    let userId = existingUserId;
    
    // Only create auth user if userId not provided
    if (!userId) {
      // First create auth user using admin API
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
      });
      
      if (authError) {
        console.error('Auth user creation error:', authError);
        return null;
      }
      
      // Get the user ID from auth
      userId = authData.user.id;
      
      // Create user record in public.users table with role
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: email,
          role: 'parent'
        });
      
      if (userError) {
        console.error('User table insert error:', userError);
        return null;
      }
    }
    
    // Now create the parent with the user_id
    const { data, error } = await supabase
      .from('parents')
      .insert({
        ...parent,
        user_id: userId
      })
      .select()
      .single();
    
    if (error) {
      console.error('Parent creation error:', error);
      return null;
    }
    
    return data as Parent;
  }

  static async update(id: string, updates: Partial<Parent>): Promise<Parent | null> {
    const { data, error } = await supabase
      .from('parents')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as Parent;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('parents')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}

export class TeacherRepository {
  static async findAll(): Promise<Teacher[]> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) return [];
    return data as Teacher[];
  }

  static async findById(id: string): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Teacher;
  }

  static async create(teacher: Partial<Teacher>): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('teachers')
      .insert(teacher)
      .select()
      .single();
    
    if (error) return null;
    return data as Teacher;
  }

  static async update(id: string, updates: Partial<Teacher>): Promise<Teacher | null> {
    const { data, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as Teacher;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('teachers')
      .select('*', { count: 'exact', head: true });
    
    return count || 0;
  }
}

export class ClassRepository {
  static async findAll(): Promise<Class[]> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      return [];
    }
    return data as Class[];
  }

  static async findById(id: string): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Class;
  }

  static async create(classData: Partial<Class>): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .insert(classData)
      .select()
      .single();
    
    if (error) return null;
    return data as Class;
  }

  static async update(id: string, updates: Partial<Class>): Promise<Class | null> {
    const { data, error } = await supabase
      .from('classes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as Class;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  static async count(): Promise<number> {
    const { count, error } = await supabase
      .from('classes')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');
    
    return count || 0;
  }
}

export class SubjectRepository {
  static async findAll(): Promise<Subject[]> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name', { ascending: true });
    
    if (error) return [];
    return data as Subject[];
  }

  static async findById(id: string): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) return null;
    return data as Subject;
  }

  static async create(subject: Partial<Subject>): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .insert(subject)
      .select()
      .single();
    
    if (error) return null;
    return data as Subject;
  }

  static async update(id: string, updates: Partial<Subject>): Promise<Subject | null> {
    const { data, error } = await supabase
      .from('subjects')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) return null;
    return data as Subject;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);
    
    return !error;
  }
}


export class AttendanceRepository {
  // Find or create session by schedule_id and date
  static async findOrCreateSession(scheduleId: string, date: string): Promise<AttendanceSession | null> {
    // Try to find existing session
    const { data: existingSession } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('schedule_id', scheduleId)
      .eq('date', date)
      .single();

    if (existingSession) {
      return existingSession as AttendanceSession;
    }

    // Create new session
    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({ schedule_id: scheduleId, date })
      .select()
      .single();

    if (error) {
      console.error('Create attendance session error:', error);
      return null;
    }

    return data as AttendanceSession;
  }

  // Find session by id
  static async findSessionById(sessionId: string): Promise<AttendanceSession | null> {
    const { data, error } = await supabase
      .from('attendance_sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (error) {
      console.error('Find session by id error:', error);
      return null;
    }

    return data as AttendanceSession;
  }

  // Get all records for a session
  static async findRecordsBySessionId(sessionId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, students(name)')
      .eq('session_id', sessionId);

    if (error) {
      console.error('Find records by session error:', error);
      return [];
    }

    return (data || []).map(record => ({
      ...record,
      student_name: record.students?.name,
    })) as AttendanceRecord[];
  }

  // Create or update attendance record
  static async upsertRecord(record: Partial<AttendanceRecord>): Promise<AttendanceRecord | null> {
    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    const { data, error } = await supabase
      .from('attendance_records')
      .upsert({ ...record, semester_id: activeSemester?.id }, { onConflict: 'session_id,student_id' })
      .select()
      .single();

    if (error) {
      console.error('Upsert attendance record error:', error);
      return null;
    }

    return data as AttendanceRecord;
  }

  // Get attendance by class and date
  static async findByClassAndDate(classId: string, date: string): Promise<{ lessons: LessonAttendance[] }> {
    // Get schedules for this class with subject and teacher details
    const { data: schedules } = await supabase
      .from('weekly_schedule')
      .select(`
        id,
        day_of_week,
        start_time,
        end_time,
        subjects(id, name),
        teachers(id, name)
      `)
      .eq('class_id', classId);

    if (!schedules || schedules.length === 0) {
      return { lessons: [] };
    }

    // Get day of week from date
    const dayOfWeek = new Date(date).getDay();
    const todaySchedules = schedules.filter(s => s.day_of_week === dayOfWeek);

    if (todaySchedules.length === 0) {
      return { lessons: [] };
    }

    const scheduleIds = todaySchedules.map(s => s.id);

    // Get sessions for these schedules on this date
    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('*')
      .in('schedule_id', scheduleIds)
      .eq('date', date);

    // Get all records for these sessions
    const sessionIds = sessions?.map(s => s.id) || [];
    const { data: records } = sessionIds.length > 0 ? await supabase
      .from('attendance_records')
      .select('*, students(name)')
      .in('session_id', sessionIds) : { data: [] };

    // Group records by session
    const recordsBySession: Record<string, any[]> = {};
    (records || []).forEach(record => {
      if (!recordsBySession[record.session_id]) {
        recordsBySession[record.session_id] = [];
      }
      recordsBySession[record.session_id].push({
        ...record,
        student_name: record.students?.name,
      });
    });

    // Map sessions to schedules with lesson details
    const lessons: LessonAttendance[] = todaySchedules.map(schedule => {
      const session = sessions?.find(s => s.schedule_id === schedule.id);
      // Access joined data - Supabase returns objects, not arrays
      const subject = (schedule as any).subjects;
      const teacher = (schedule as any).teachers;
      return {
        schedule_id: schedule.id,
        session_id: session?.id || null,
        subject_name: subject?.name || '-',
        teacher_name: teacher?.name || '-',
        start_time: schedule.start_time,
        end_time: schedule.end_time,
        has_attendance: !!session && (recordsBySession[session.id]?.length > 0),
        records: recordsBySession[session?.id] || [],
      };
    }).filter(lesson => lesson.has_attendance); // Only show lessons with attendance

    return { lessons };
  }

  // Get attendance statistics for today (for dashboard)
  static async getTodayAttendanceRate(): Promise<number> {
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    const { data: sessions } = await supabase
      .from('attendance_sessions')
      .select('id')
      .eq('date', today);

    if (!sessions || sessions.length === 0) {
      return 0;
    }

    const sessionIds = sessions.map(s => s.id);

    const { data: records } = await supabase
      .from('attendance_records')
      .select('status')
      .in('session_id', sessionIds);

    if (!records || records.length === 0) {
      return 0;
    }

    const presentCount = records.filter(r => r.status === 'present').length;
    return Math.round((presentCount / records.length) * 100);
  }

  // Get student attendance history
  static async findByStudentId(studentId: string): Promise<AttendanceRecord[]> {
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*, attendance_sessions(date, schedule_id)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Find by student id error:', error);
      return [];
    }

    return data as AttendanceRecord[];
  }
}

export class PaymentRepository {
  static async findAll(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .order('due_date', { ascending: true });
    
    if (error) return [];
    return data as Payment[];
  }

  static async findPending(): Promise<Payment[]> {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('is_paid', false)
      .order('due_date', { ascending: true });
    
    if (error) return [];
    return data as Payment[];
  }

  static async countPending(): Promise<number> {
    const { count, error } = await supabase
      .from('payments')
      .select('*', { count: 'exact', head: true })
      .eq('is_paid', false);
    
    return count || 0;
  }
}

export class ScheduleRepository {
  static async findByClassId(classId: string): Promise<Schedule[]> {
    const { data, error } = await supabase
      .from('schedule')
      .select('*')
      .eq('class_id', classId)
      .order('day', { ascending: true })
      .order('start_time', { ascending: true });
    
    if (error) return [];
    return data as Schedule[];
  }
}

export class TeacherAssignmentRepository {
  static async findAll(): Promise<TeacherAssignment[]> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teachers(name),
        subjects(name),
        classes(name)
      `)
      .order('created_at', { ascending: false });

    if (error) return [];

    return (data || []).map((record: any) => ({
      ...record,
      teacher_name: record.teachers?.name,
      subject_name: record.subjects?.name,
      class_name: record.classes?.name,
    })) as TeacherAssignment[];
  }

  static async findById(id: string): Promise<TeacherAssignment | null> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teachers(name),
        subjects(name),
        classes(name)
      `)
      .eq('id', id)
      .single();

    if (error) return null;

    return {
      ...data,
      teacher_name: data.teachers?.name,
      subject_name: data.subjects?.name,
      class_name: data.classes?.name,
    } as TeacherAssignment;
  }

  static async findByTeacherId(teacherId: string): Promise<TeacherAssignment[]> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        classes(*)
      `)
      .eq('teacher_id', teacherId);

    if (error) return [];

    return (data || []).map((record: any) => ({
      ...record,
      class_name: record.classes?.name,
    })) as TeacherAssignment[];
  }

  static async create(assignment: Partial<TeacherAssignment>): Promise<TeacherAssignment | null> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .insert(assignment)
      .select()
      .single();

    if (error) return null;
    return data as TeacherAssignment;
  }

  static async findByTeacherClassSubject(teacherId: string, classId: string, subjectId: string): Promise<TeacherAssignment | null> {
    const { data, error } = await supabase
      .from('teacher_assignments')
      .select(`
        *,
        teachers(name),
        subjects(name),
        classes(name)
      `)
      .eq('teacher_id', teacherId)
      .eq('class_id', classId)
      .eq('subject_id', subjectId)
      .single();

    if (error) return null;

    return {
      ...data,
      teacher_name: data.teachers?.name,
      subject_name: data.subjects?.name,
      class_name: data.classes?.name,
    } as TeacherAssignment;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('teacher_assignments')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class WeeklyScheduleRepository {
  static async findAll(): Promise<WeeklySchedule[]> {
    const { data, error } = await supabase
      .from('weekly_schedule')
      .select(`
        *,
        classes(name),
        subjects(name),
        teachers(name)
      `)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('WeeklySchedule findAll error:', error);
      return [];
    }

    return (data || []).map((record: any) => ({
      ...record,
      class_name: record.classes?.name,
      subject_name: record.subjects?.name,
      teacher_name: record.teachers?.name,
    })) as WeeklySchedule[];
  }

  static async findByClassId(classId: string): Promise<WeeklySchedule[]> {
    const { data, error } = await supabase
      .from('weekly_schedule')
      .select(`
        *,
        classes(name),
        subjects(name),
        teachers(name)
      `)
      .eq('class_id', classId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('WeeklySchedule findByClassId error:', error);
      return [];
    }

    return (data || []).map((record: any) => ({
      ...record,
      class_name: record.classes?.name,
      subject_name: record.subjects?.name,
      teacher_name: record.teachers?.name,
    })) as WeeklySchedule[];
  }

  static async findByTeacherId(teacherId: string): Promise<WeeklySchedule[]> {
    const { data, error } = await supabase
      .from('weekly_schedule')
      .select(`
        *,
        classes(name),
        subjects(name),
        teachers(name)
      `)
      .eq('teacher_id', teacherId)
      .order('day_of_week', { ascending: true })
      .order('start_time', { ascending: true });

    if (error) {
      console.error('WeeklySchedule findByTeacherId error:', error);
      return [];
    }

    return (data || []).map((record: any) => ({
      ...record,
      class_name: record.classes?.name,
      subject_name: record.subjects?.name,
      teacher_name: record.teachers?.name,
    })) as WeeklySchedule[];
  }

  static async findById(id: string): Promise<WeeklySchedule | null> {
    const { data, error } = await supabase
      .from('weekly_schedule')
      .select(`
        *,
        classes(name),
        subjects(name),
        teachers(name)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('WeeklySchedule findById error:', error);
      return null;
    }

    return {
      ...data,
      class_name: data.classes?.name,
      subject_name: data.subjects?.name,
      teacher_name: data.teachers?.name,
    } as WeeklySchedule;
  }

  static async create(schedule: Partial<WeeklySchedule>): Promise<WeeklySchedule | null> {
    const { data, error } = await supabase
      .from('weekly_schedule')
      .insert(schedule)
      .select()
      .single();

    if (error) {
      console.error('WeeklySchedule create error:', error);
      return null;
    }

    return data as WeeklySchedule;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('weekly_schedule')
      .delete()
      .eq('id', id);

    return !error;
  }

  // Check for overlapping schedules for a class
  static async hasClassOverlap(
    classId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('weekly_schedule')
      .select('id, start_time, end_time')
      .eq('class_id', classId)
      .eq('day_of_week', dayOfWeek);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error || !data) return false;

    // Check for time overlap
    return data.some((record: any) => {
      const existingStart = record.start_time;
      const existingEnd = record.end_time;
      // Overlap if: new start < existing end AND new end > existing start
      return startTime < existingEnd && endTime > existingStart;
    });
  }

  // Check for overlapping schedules for a teacher
  static async hasTeacherOverlap(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    let query = supabase
      .from('weekly_schedule')
      .select('id, start_time, end_time')
      .eq('teacher_id', teacherId)
      .eq('day_of_week', dayOfWeek);

    if (excludeId) {
      query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error || !data) return false;

    // Check for time overlap
    return data.some((record: any) => {
      const existingStart = record.start_time;
      const existingEnd = record.end_time;
      // Overlap if: new start < existing end AND new end > existing start
      return startTime < existingEnd && endTime > existingStart;
    });
  }
}

export class TimeSlotRepository {
  static async findAll(): Promise<TimeSlot[]> {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .order('start_time', { ascending: true });

    if (error) {
      console.error('TimeSlot findAll error:', error);
      return [];
    }

    return data as TimeSlot[];
  }

  static async create(timeSlot: Partial<TimeSlot>): Promise<TimeSlot | null> {
    const { data, error } = await supabase
      .from('time_slots')
      .insert(timeSlot)
      .select()
      .single();

    if (error) {
      console.error('TimeSlot create error:', error);
      return null;
    }

    return data as TimeSlot;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('time_slots')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class DashboardRepository {
  static async getStats(): Promise<DashboardStats> {
    const [totalStudents, totalTeachers, totalClasses, pendingPayments, newSuggestions] = 
      await Promise.all([
        StudentRepository.count(),
        TeacherRepository.count(),
        ClassRepository.count(),
        PaymentRepository.countPending(),
        SuggestionRepository.countNew(),
      ]);

    const attendanceRate = await AttendanceRepository.getTodayAttendanceRate();

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
      pendingPayments,
      newSuggestions,
    };
  }
}

// New Grades System Repositories
export class ExamRepository {
  static async create(exam: Partial<Exam>): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .insert(exam)
      .select()
      .single();

    if (error) {
      console.error('Exam create error:', error);
      return null;
    }
    return data as Exam;
  }

  static async findById(id: string): Promise<Exam | null> {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name), teachers(name)')
      .eq('id', id)
      .single();

    if (error) return null;
    return {
      ...data,
      subject_name: (data as any).subjects?.name,
      class_name: (data as any).classes?.name,
      teacher_name: (data as any).teachers?.name,
    } as Exam;
  }

  static async findByTeacherId(teacherId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name)')
      .eq('teacher_id', teacherId)
      .order('exam_date', { ascending: false });

    if (error) return [];
    return (data || []).map((item: any) => ({
      ...item,
      subject_name: item.subjects?.name,
      class_name: item.classes?.name,
    })) as Exam[];
  }

  static async findByClassId(classId: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name), teachers(name)')
      .eq('class_id', classId)
      .order('exam_date', { ascending: false });

    if (error) return [];
    return (data || []).map((item: any) => ({
      ...item,
      subject_name: item.subjects?.name,
      teacher_name: item.teachers?.name,
    })) as Exam[];
  }

  static async findAll(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*, subjects(name), classes(name), teachers(name)')
      .order('exam_date', { ascending: false });

    if (error) return [];
    return (data || []).map((item: any) => ({
      ...item,
      subject_name: item.subjects?.name,
      class_name: item.classes?.name,
      teacher_name: item.teachers?.name,
    })) as Exam[];
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class GradeRepository {
  static async create(grade: Partial<Grade>): Promise<Grade | null> {
    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    const { data, error } = await supabase
      .from('grades')
      .insert({ ...grade, semester_id: activeSemester?.id })
      .select()
      .single();

    if (error) {
      console.error('Grade create error:', error);
      return null;
    }
    return data as Grade;
  }

  static async createMany(grades: Partial<Grade>[]): Promise<boolean> {
    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    const gradesWithSemester = grades.map(g => ({ ...g, semester_id: activeSemester?.id }));

    const { error } = await supabase
      .from('grades')
      .insert(gradesWithSemester);

    if (error) {
      console.error('Grade createMany error:', error);
      return false;
    }
    return true;
  }

  static async upsert(grade: Partial<Grade>): Promise<Grade | null> {
    const { data, error } = await supabase
      .from('grades')
      .upsert(grade, { 
        onConflict: 'exam_id,student_id',
        ignoreDuplicates: false
      })
      .select()
      .single();

    if (error) {
      console.error('Grade upsert error:', error);
      return null;
    }
    return data as Grade;
  }

  static async findByExamId(examId: string): Promise<Grade[]> {
    const { data, error } = await supabase
      .from('grades')
      .select('*, students(name)')
      .eq('exam_id', examId);

    if (error) return [];
    return (data || []).map((item: any) => ({
      ...item,
      student_name: item.students?.name,
    })) as Grade[];
  }

  static async findByStudentId(studentId: string): Promise<Grade[]> {
    const { data, error } = await supabase
      .from('grades')
      .select('*, exams(name, max_score, exam_date, subjects(name))')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map((item: any) => ({
      ...item,
      exam_name: item.exams?.name,
      max_score: item.exams?.max_score,
      exam_date: item.exams?.exam_date,
      subject_name: item.exams?.subjects?.name,
    })) as Grade[];
  }

  static async findByExamAndStudent(examId: string, studentId: string): Promise<Grade | null> {
    const { data, error } = await supabase
      .from('grades')
      .select('*')
      .eq('exam_id', examId)
      .eq('student_id', studentId)
      .single();

    if (error) return null;
    return data as Grade;
  }

  static async update(id: string, score: number): Promise<boolean> {
    const { error } = await supabase
      .from('grades')
      .update({ score })
      .eq('id', id);

    return !error;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class AnnouncementRepository {
  static async findAll(): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('findAll error:', error);
      return [];
    }
    return data || [];
  }

  static async findByAudience(audience: string[]): Promise<Announcement[]> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .in('audience', audience)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('findByAudience error:', error);
      return [];
    }
    return data || [];
  }

  static async findById(id: string): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('findById error:', error);
      return null;
    }
    return data as Announcement;
  }

  static async create(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .insert({
        title: announcement.title,
        content: announcement.content,
        audience: announcement.audience,
        created_by: announcement.created_by,
      })
      .select()
      .single();

    if (error) return null;
    return data as Announcement;
  }

  static async update(id: string, announcement: Partial<Announcement>): Promise<Announcement | null> {
    const { data, error } = await supabase
      .from('announcements')
      .update({
        title: announcement.title,
        content: announcement.content,
        audience: announcement.audience,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) return null;
    return data as Announcement;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    return !error;
  }
}

export class SuggestionRepository {
  static async findAll(): Promise<Suggestion[]> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('findAll error:', error);
      return [];
    }
    return data || [];
  }

  static async findById(id: string): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('findById error:', error);
      return null;
    }
    return data as Suggestion;
  }

  static async create(suggestion: Omit<Suggestion, 'id' | 'created_at' | 'status'>): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .insert({
        title: suggestion.title,
        message: suggestion.message,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('create error:', error);
      return null;
    }
    return data as Suggestion;
  }

  static async updateStatus(id: string, status: Suggestion['status']): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('updateStatus error:', error);
      return null;
    }
    return data as Suggestion;
  }

  static async delete(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('suggestions')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('delete error:', error);
      return false;
    }
    return true;
  }

  static async addReply(id: string, reply: string, replied_by?: string): Promise<Suggestion | null> {
    const { data, error } = await supabase
      .from('suggestions')
      .update({
        reply,
        replied_at: new Date().toISOString(),
        replied_by,
        status: 'reviewed',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('addReply error:', error);
      return null;
    }
    return data as Suggestion;
  }

  static async countNew(): Promise<number> {
    const { count, error } = await supabase
      .from('suggestions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('countNew error:', error);
      return 0;
    }
    return count || 0;
  }
}

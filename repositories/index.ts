import { query } from '@/lib/db';
import bcrypt from 'bcrypt';
import type {
  User,
  Student,
  Teacher,
  Class,
  Subject,
  AcademicYear,
  Semester,
  Announcement,
  Payment,
  StudentFee,
  FeePayment,
  PaymentSummary,
  Schedule,
  Complaint,
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
  News,
} from '@/types';

export class UserRepository {
  static async findByEmail(email: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE email = $1', [email]);
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error in UserRepository.findByEmail:', error);
      return null;
    }
  }

  static async findById(id: string): Promise<User | null> {
    try {
      const result = await query('SELECT * FROM users WHERE id = $1', [id]);
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error in UserRepository.findById:', error);
      return null;
    }
  }

  static async create(user: Partial<User> & Record<string, any>): Promise<User | null> {
    try {
      const { id, email, name, role, phone, password_hash } = user;
      const result = await query(
        'INSERT INTO users (id, email, name, role, phone, password_hash) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, email, name, role, phone, password_hash]
      );
      return result.rows[0] as User;
    } catch (error) {
      console.error('Error in UserRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<User> & Record<string, any>): Promise<User | null> {
    try {
      const { email, name, role, phone, password_hash } = updates;
      const result = await query(
        'UPDATE users SET email = $1, name = $2, role = $3, phone = $4, password_hash = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [email, name, role, phone, password_hash, id]
      );
      return result.rows[0] as User || null;
    } catch (error) {
      console.error('Error in UserRepository.update:', error);
      return null;
    }
  }
}

export class StudentRepository {
  static async findAll(): Promise<Student[]> {
    try {
      const result = await query(`
        SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone, p.address as parent_address
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN parents p ON s.parent_id = p.id
        ORDER BY s.created_at DESC
      `);
      return result.rows as Student[];
    } catch (error) {
      console.error('Error in StudentRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Student | null> {
    try {
      const result = await query(`
        SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.id = $1
      `, [id]);
      return result.rows[0] as Student || null;
    } catch (error) {
      console.error('Error in StudentRepository.findById:', error);
      return null;
    }
  }

  static async findByClassId(classId: string): Promise<Student[]> {
    try {
      const result = await query('SELECT * FROM students WHERE class_id = $1 ORDER BY created_at DESC', [classId]);
      return result.rows as Student[];
    } catch (error) {
      console.error('Error in StudentRepository.findByClassId:', error);
      return [];
    }
  }

  static async findByParentId(parentId: string): Promise<Student[]> {
    try {
      const result = await query('SELECT * FROM students WHERE parent_id = $1 ORDER BY created_at DESC', [parentId]);
      return result.rows as Student[];
    } catch (error) {
      console.error('Error in StudentRepository.findByParentId:', error);
      return [];
    }
  }

  static async findByClassIds(classIds: string[]): Promise<Student[]> {
    if (classIds.length === 0) return [];
    
    try {
      const result = await query(`
        SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone, p.address as parent_address
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.class_id = ANY($1)
        ORDER BY s.created_at DESC
      `, [classIds]);
      return result.rows as Student[];
    } catch (error) {
      console.error('Error in StudentRepository.findByClassIds:', error);
      return [];
    }
  }

  static async findByLoginName(loginName: string): Promise<Student | null> {
    try {
      const result = await query(`
        SELECT s.*, c.name as class_name, p.id as parent_id, p.name as parent_name, p.phone as parent_phone, p.address as parent_address
        FROM students s
        LEFT JOIN classes c ON s.class_id = c.id
        LEFT JOIN parents p ON s.parent_id = p.id
        WHERE s.login_name = $1
      `, [loginName]);
      return result.rows[0] as Student || null;
    } catch (error) {
      console.error('Error in StudentRepository.findByLoginName:', error);
      return null;
    }
  }

  static async create(student: Partial<Student> & Record<string, any>): Promise<Student | null> {
    try {
      const { id, user_id, parent_id, class_id, name, login_name, date_of_birth, gender, address } = student;
      const result = await query(
        'INSERT INTO students (id, user_id, parent_id, class_id, name, login_name, date_of_birth, gender, address) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
        [id, user_id, parent_id, class_id, name, login_name, date_of_birth, gender, address]
      );
      return result.rows[0] as Student;
    } catch (error) {
      console.error('Error in StudentRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Student> & Record<string, any>): Promise<Student | null> {
    try {
      const { parent_id, class_id, name, login_name, date_of_birth, gender, address } = updates;
      const result = await query(
        'UPDATE students SET parent_id = $1, class_id = $2, name = $3, login_name = $4, date_of_birth = $5, gender = $6, address = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 RETURNING *',
        [parent_id, class_id, name, login_name, date_of_birth, gender, address, id]
      );
      return result.rows[0] as Student || null;
    } catch (error) {
      console.error('Error in StudentRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM students WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in StudentRepository.delete:', error);
      return false;
    }
  }

  static async count(): Promise<number> {
    try {
      const result = await query('SELECT COUNT(*) FROM students');
      return parseInt(result.rows[0].count, 10) || 0;
    } catch (error) {
      console.error('Error in StudentRepository.count:', error);
      return 0;
    }
  }
}

export class ParentRepository {
  static async findAll(): Promise<Parent[]> {
    try {
      const result = await query('SELECT * FROM parents ORDER BY created_at DESC');
      return result.rows as Parent[];
    } catch (error) {
      console.error('Error in ParentRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Parent | null> {
    try {
      const result = await query('SELECT * FROM parents WHERE id = $1', [id]);
      return result.rows[0] as Parent || null;
    } catch (error) {
      console.error('Error in ParentRepository.findById:', error);
      return null;
    }
  }

  static async findByPhone(phone: string): Promise<Parent | null> {
    try {
      const result = await query('SELECT * FROM parents WHERE phone = $1', [phone]);
      return result.rows[0] as Parent || null;
    } catch (error) {
      console.error('Error in ParentRepository.findByPhone:', error);
      return null;
    }
  }

  static async create(
    parent: Omit<Parent, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'auth_email'> & Record<string, any>,
    authEmail: string,
    password: string,
    existingUserId?: string
  ): Promise<Parent | null> {
    let userId = existingUserId;
    
    // Only create auth user if userId not provided
    if (!userId) {
      try {
        // Generate UUID for new user
        const uuidResult = await query('SELECT gen_random_uuid() as uuid');
        userId = uuidResult.rows[0].uuid;
        
        // Hash the password with bcrypt (10 salt rounds)
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user record in users table with hashed password
        await query(
          'INSERT INTO users (id, email, password_hash, role) VALUES ($1, $2, $3, $4)',
          [userId, authEmail, hashedPassword, 'parent']
        );
      } catch (error) {
        console.error('Error in ParentRepository.create - user creation:', error);
        return null;
      }
    }
    
    // Now create the parent with the user_id and auth_email
    try {
      const { name, phone, address } = parent;
      const result = await query(
        'INSERT INTO parents (user_id, auth_email, name, phone, address) VALUES ($1, $2, $3, $4, $5) RETURNING *',
        [userId, authEmail, name, phone, address]
      );
      return result.rows[0] as Parent;
    } catch (error) {
      console.error('Error in ParentRepository.create - parent insert:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Parent> & Record<string, any>): Promise<Parent | null> {
    try {
      const { name, phone, address, user_id, auth_email } = updates;
      const result = await query(
        'UPDATE parents SET name = $1, phone = $2, address = $3, user_id = $4, auth_email = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [name, phone, address, user_id, auth_email, id]
      );
      return result.rows[0] as Parent || null;
    } catch (error) {
      console.error('Error in ParentRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM parents WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in ParentRepository.delete:', error);
      return false;
    }
  }
}

export class TeacherRepository {
  static async findAll(): Promise<Teacher[]> {
    try {
      const result = await query('SELECT * FROM teachers ORDER BY created_at DESC');
      return result.rows as Teacher[];
    } catch (error) {
      console.error('Error in TeacherRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Teacher | null> {
    try {
      const result = await query('SELECT * FROM teachers WHERE id = $1', [id]);
      return result.rows[0] as Teacher || null;
    } catch (error) {
      console.error('Error in TeacherRepository.findById:', error);
      return null;
    }
  }

  static async create(teacher: Partial<Teacher> & Record<string, any>): Promise<Teacher | null> {
    try {
      const { id, user_id, name, subject, phone, address } = teacher;
      const result = await query(
        'INSERT INTO teachers (id, user_id, name, subject, phone, address) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [id, user_id, name, subject, phone, address]
      );
      return result.rows[0] as Teacher;
    } catch (error) {
      console.error('Error in TeacherRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Teacher> & Record<string, any>): Promise<Teacher | null> {
    try {
      const { user_id, name, subject, phone, address } = updates;
      const result = await query(
        'UPDATE teachers SET user_id = $1, name = $2, subject = $3, phone = $4, address = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING *',
        [user_id, name, subject, phone, address, id]
      );
      return result.rows[0] as Teacher || null;
    } catch (error) {
      console.error('Error in TeacherRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM teachers WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in TeacherRepository.delete:', error);
      return false;
    }
  }

  static async count(): Promise<number> {
    try {
      const result = await query('SELECT COUNT(*) FROM teachers');
      return parseInt(result.rows[0].count, 10) || 0;
    } catch (error) {
      console.error('Error in TeacherRepository.count:', error);
      return 0;
    }
  }
}

export class ClassRepository {
  static async findAll(): Promise<Class[]> {
    try {
      const result = await query('SELECT * FROM classes ORDER BY created_at DESC');
      return result.rows as Class[];
    } catch (error) {
      console.error('Error in ClassRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Class | null> {
    try {
      const result = await query('SELECT * FROM classes WHERE id = $1', [id]);
      return result.rows[0] as Class || null;
    } catch (error) {
      console.error('Error in ClassRepository.findById:', error);
      return null;
    }
  }

  static async create(classData: Partial<Class> & Record<string, any>): Promise<Class | null> {
    try {
      const { name } = classData;
      const result = await query(
        'INSERT INTO classes (name) VALUES ($1) RETURNING *',
        [name]
      );
      return result.rows[0] as Class;
    } catch (error) {
      console.error('Error in ClassRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Class> & Record<string, any>): Promise<Class | null> {
    try {
      const { name } = updates;
      const result = await query(
        'UPDATE classes SET name = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [name, id]
      );
      return result.rows[0] as Class || null;
    } catch (error) {
      console.error('Error in ClassRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM classes WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in ClassRepository.delete:', error);
      return false;
    }
  }

  static async count(): Promise<number> {
    try {
      const result = await query("SELECT COUNT(*) FROM classes WHERE status = 'active'");
      return parseInt(result.rows[0].count, 10) || 0;
    } catch (error) {
      console.error('Error in ClassRepository.count:', error);
      return 0;
    }
  }
}

export class SubjectRepository {
  static async findAll(): Promise<Subject[]> {
    try {
      const result = await query('SELECT * FROM subjects ORDER BY name ASC');
      return result.rows as Subject[];
    } catch (error) {
      console.error('Error in SubjectRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Subject | null> {
    try {
      const result = await query('SELECT * FROM subjects WHERE id = $1', [id]);
      return result.rows[0] as Subject || null;
    } catch (error) {
      console.error('Error in SubjectRepository.findById:', error);
      return null;
    }
  }

  static async create(subject: Partial<Subject>): Promise<Subject | null> {
    try {
      const result = await query(
        'INSERT INTO subjects (name) VALUES ($1) RETURNING *',
        [subject.name]
      );
      return result.rows[0] as Subject;
    } catch (error) {
      console.error('Error in SubjectRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, updates: Partial<Subject>): Promise<Subject | null> {
    try {
      const result = await query(
        'UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *',
        [updates.name, id]
      );
      return result.rows[0] as Subject || null;
    } catch (error) {
      console.error('Error in SubjectRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in SubjectRepository.delete:', error);
      return false;
    }
  }
}


export class AttendanceRepository {
  // Find or create session by schedule_id and date
  static async findOrCreateSession(scheduleId: string, date: string): Promise<AttendanceSession | null> {
    try {
      // Try to find existing session
      const findResult = await query(
        'SELECT * FROM attendance_sessions WHERE schedule_id = $1 AND date = $2',
        [scheduleId, date]
      );
      
      if (findResult.rows.length > 0) {
        return findResult.rows[0] as AttendanceSession;
      }

      // Create new session
      const insertResult = await query(
        'INSERT INTO attendance_sessions (schedule_id, date) VALUES ($1, $2) RETURNING *',
        [scheduleId, date]
      );
      return insertResult.rows[0] as AttendanceSession;
    } catch (error) {
      console.error('Error in AttendanceRepository.findOrCreateSession:', error);
      return null;
    }
  }

  // Find session by id
  static async findSessionById(sessionId: string): Promise<AttendanceSession | null> {
    try {
      const result = await query('SELECT * FROM attendance_sessions WHERE id = $1', [sessionId]);
      return result.rows[0] as AttendanceSession || null;
    } catch (error) {
      console.error('Error in AttendanceRepository.findSessionById:', error);
      return null;
    }
  }

  // Get all records for a session
  static async findRecordsBySessionId(sessionId: string): Promise<AttendanceRecord[]> {
    try {
      const result = await query(`
        SELECT ar.*, s.name as student_name
        FROM attendance_records ar
        LEFT JOIN students s ON ar.student_id = s.id
        WHERE ar.session_id = $1
      `, [sessionId]);
      return result.rows as AttendanceRecord[];
    } catch (error) {
      console.error('Error in AttendanceRepository.findRecordsBySessionId:', error);
      return [];
    }
  }

  // Create or update attendance record
  static async upsertRecord(record: Partial<AttendanceRecord> & Record<string, any>): Promise<AttendanceRecord | null> {
    try {
      // Get active semester
      const semesterResult = await query("SELECT id FROM semesters WHERE is_active = true LIMIT 1");
      const activeSemesterId = semesterResult.rows[0]?.id;

      const { session_id, student_id, status } = record;
      
      // Try to update first, then insert if not exists
      const updateResult = await query(`
        UPDATE attendance_records 
        SET status = $1, semester_id = $2, updated_at = CURRENT_TIMESTAMP
        WHERE session_id = $3 AND student_id = $4
        RETURNING *
      `, [status, activeSemesterId, session_id, student_id]);

      if (updateResult.rows.length > 0) {
        return updateResult.rows[0] as AttendanceRecord;
      }

      // Insert new record
      const insertResult = await query(`
        INSERT INTO attendance_records (session_id, student_id, status, semester_id)
        VALUES ($1, $2, $3, $4)
        RETURNING *
      `, [session_id, student_id, status, activeSemesterId]);

      return insertResult.rows[0] as AttendanceRecord;
    } catch (error) {
      console.error('Error in AttendanceRepository.upsertRecord:', error);
      return null;
    }
  }

  // Get attendance by class and date
  static async findByClassAndDate(classId: string, date: string): Promise<{ lessons: LessonAttendance[] }> {
    try {
      // Get schedules for this class with subject and teacher details
      const schedulesResult = await query(`
        SELECT ws.id, ws.day_of_week, ws.start_time, ws.end_time,
               s.name as subject_name, t.name as teacher_name
        FROM weekly_schedule ws
        LEFT JOIN subjects s ON ws.subject_id = s.id
        LEFT JOIN teachers t ON ws.teacher_id = t.id
        WHERE ws.class_id = $1
      `, [classId]);

      const schedules = schedulesResult.rows;
      if (schedules.length === 0) {
        return { lessons: [] };
      }

      // Get day of week from date
      const dayOfWeek = new Date(date).getDay();
      const todaySchedules = schedules.filter((s: any) => s.day_of_week === dayOfWeek);

      if (todaySchedules.length === 0) {
        return { lessons: [] };
      }

      const scheduleIds = todaySchedules.map((s: any) => s.id);

      // Get sessions for these schedules on this date
      const sessionsResult = await query(`
        SELECT * FROM attendance_sessions 
        WHERE schedule_id = ANY($1) AND date = $2
      `, [scheduleIds, date]);
      const sessions = sessionsResult.rows;

      // Get all records for these sessions
      const sessionIds = sessions.map((s: any) => s.id);
      let records: any[] = [];
      if (sessionIds.length > 0) {
        const recordsResult = await query(`
          SELECT ar.*, s.name as student_name
          FROM attendance_records ar
          LEFT JOIN students s ON ar.student_id = s.id
          WHERE ar.session_id = ANY($1)
        `, [sessionIds]);
        records = recordsResult.rows;
      }

      // Group records by session
      const recordsBySession: Record<string, any[]> = {};
      records.forEach((record: any) => {
        if (!recordsBySession[record.session_id]) {
          recordsBySession[record.session_id] = [];
        }
        recordsBySession[record.session_id].push(record);
      });

      // Map sessions to schedules with lesson details
      const lessons: LessonAttendance[] = todaySchedules.map((schedule: any) => {
        const session = sessions.find((s: any) => s.schedule_id === schedule.id);
        return {
          schedule_id: schedule.id,
          session_id: session?.id || null,
          subject_name: schedule.subject_name || '-',
          teacher_name: schedule.teacher_name || '-',
          start_time: schedule.start_time,
          end_time: schedule.end_time,
          has_attendance: !!session && (recordsBySession[session.id]?.length > 0),
          records: recordsBySession[session?.id] || [],
        };
      }).filter((lesson: any) => lesson.has_attendance);

      return { lessons };
    } catch (error) {
      console.error('Error in AttendanceRepository.findByClassAndDate:', error);
      return { lessons: [] };
    }
  }

  // Get attendance statistics for today (for dashboard)
  static async getTodayAttendanceRate(): Promise<number> {
    try {
      const todayDate = new Date();
      const year = todayDate.getFullYear();
      const month = String(todayDate.getMonth() + 1).padStart(2, '0');
      const day = String(todayDate.getDate()).padStart(2, '0');
      const today = `${year}-${month}-${day}`;

      const sessionsResult = await query('SELECT id FROM attendance_sessions WHERE date = $1', [today]);
      const sessions = sessionsResult.rows;

      if (sessions.length === 0) {
        return 0;
      }

      const sessionIds = sessions.map((s: any) => s.id);

      const recordsResult = await query('SELECT status FROM attendance_records WHERE session_id = ANY($1)', [sessionIds]);
      const records = recordsResult.rows;

      if (records.length === 0) {
        return 0;
      }

      const presentCount = records.filter((r: any) => r.status === 'present').length;
      return Math.round((presentCount / records.length) * 100);
    } catch (error) {
      console.error('Error in AttendanceRepository.getTodayAttendanceRate:', error);
      return 0;
    }
  }

  // Get student attendance history
  static async findByStudentId(studentId: string): Promise<AttendanceRecord[]> {
    try {
      const result = await query(`
        SELECT ar.*, a_ses.date, a_ses.schedule_id
        FROM attendance_records ar
        LEFT JOIN attendance_sessions a_ses ON ar.session_id = a_ses.id
        WHERE ar.student_id = $1
        ORDER BY ar.created_at DESC
      `, [studentId]);
      return result.rows as AttendanceRecord[];
    } catch (error) {
      console.error('Error in AttendanceRepository.findByStudentId:', error);
      return [];
    }
  }
}

export class StudentFeeRepository {
  static async findAll(): Promise<StudentFee[]> {
    try {
      const result = await query(`
        SELECT 
          sf.*,
          s.name as student_name,
          ay.name as academic_year_name
        FROM student_fees sf
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN academic_years ay ON sf.academic_year_id = ay.id
        ORDER BY s.name ASC
      `);
      return result.rows as StudentFee[];
    } catch (error) {
      console.error('Error in StudentFeeRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<StudentFee | null> {
    try {
      const result = await query(`
        SELECT 
          sf.*,
          s.name as student_name,
          ay.name as academic_year_name
        FROM student_fees sf
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN academic_years ay ON sf.academic_year_id = ay.id
        WHERE sf.id = $1
      `, [id]);
      return result.rows[0] as StudentFee || null;
    } catch (error) {
      console.error('Error in StudentFeeRepository.findById:', error);
      return null;
    }
  }

  static async findByStudentId(studentId: string): Promise<StudentFee[]> {
    try {
      const result = await query(`
        SELECT 
          sf.*,
          s.name as student_name,
          ay.name as academic_year_name
        FROM student_fees sf
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN academic_years ay ON sf.academic_year_id = ay.id
        WHERE sf.student_id = $1
        ORDER BY ay.start_date DESC
      `, [studentId]);
      return result.rows as StudentFee[];
    } catch (error) {
      console.error('Error in StudentFeeRepository.findByStudentId:', error);
      return [];
    }
  }

  static async findByStudentAndYear(studentId: string, academicYearId: string): Promise<StudentFee | null> {
    try {
      const result = await query(`
        SELECT 
          sf.*,
          s.name as student_name,
          ay.name as academic_year_name
        FROM student_fees sf
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN academic_years ay ON sf.academic_year_id = ay.id
        WHERE sf.student_id = $1 AND sf.academic_year_id = $2
      `, [studentId, academicYearId]);
      return result.rows[0] as StudentFee || null;
    } catch (error) {
      console.error('Error in StudentFeeRepository.findByStudentAndYear:', error);
      return null;
    }
  }

  static async create(data: Omit<StudentFee, 'id' | 'created_at' | 'updated_at'>): Promise<StudentFee | null> {
    try {
      const result = await query(
        `INSERT INTO student_fees (student_id, academic_year_id, school_fee, transport_fee, created_at, updated_at)
         VALUES ($1, $2, $3, $4, timezone('utc', now()), timezone('utc', now()))
         RETURNING *`,
        [data.student_id, data.academic_year_id, data.school_fee, data.transport_fee]
      );
      return result.rows[0] as StudentFee;
    } catch (error) {
      console.error('Error in StudentFeeRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, data: Partial<Omit<StudentFee, 'id' | 'created_at' | 'updated_at'>>): Promise<StudentFee | null> {
    try {
      const result = await query(
        `UPDATE student_fees 
         SET school_fee = COALESCE($2, school_fee), 
             transport_fee = COALESCE($3, transport_fee),
             updated_at = timezone('utc', now())
         WHERE id = $1
         RETURNING *`,
        [id, data.school_fee, data.transport_fee]
      );
      return result.rows[0] as StudentFee || null;
    } catch (error) {
      console.error('Error in StudentFeeRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM student_fees WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in StudentFeeRepository.delete:', error);
      return false;
    }
  }

  static async getFinancialSummary(): Promise<PaymentSummary> {
    try {
      const result = await query(`
        SELECT 
          COALESCE(SUM(school_fee + transport_fee), 0) as total_fees,
          COUNT(DISTINCT student_id) as student_count
        FROM student_fees
      `);
      
      const totalFees = parseFloat(result.rows[0]?.total_fees || 0);
      
      // Get total paid from fee_payments
      const paymentsResult = await query(`
        SELECT COALESCE(SUM(amount), 0) as total_paid
        FROM fee_payments
      `);
      
      const totalPaid = parseFloat(paymentsResult.rows[0]?.total_paid || 0);
      
      return {
        total_fees: totalFees,
        total_paid: totalPaid,
        total_remaining: totalFees - totalPaid,
        student_count: parseInt(result.rows[0]?.student_count || 0)
      };
    } catch (error) {
      console.error('Error in StudentFeeRepository.getFinancialSummary:', error);
      return { total_fees: 0, total_paid: 0, total_remaining: 0, student_count: 0 };
    }
  }
}

export class FeePaymentRepository {
  static async findAll(): Promise<FeePayment[]> {
    try {
      const result = await query(`
        SELECT 
          fp.*,
          s.name as student_name,
          u.name as created_by_name
        FROM fee_payments fp
        LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN users u ON fp.created_by = u.id
        ORDER BY fp.payment_date DESC
      `);
      return result.rows as FeePayment[];
    } catch (error) {
      console.error('Error in FeePaymentRepository.findAll:', error);
      return [];
    }
  }

  static async findByStudentFeeId(studentFeeId: string): Promise<FeePayment[]> {
    try {
      const result = await query(`
        SELECT 
          fp.*,
          s.name as student_name,
          u.name as created_by_name
        FROM fee_payments fp
        LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN users u ON fp.created_by = u.id
        WHERE fp.student_fee_id = $1
        ORDER BY fp.payment_date DESC
      `, [studentFeeId]);
      return result.rows as FeePayment[];
    } catch (error) {
      console.error('Error in FeePaymentRepository.findByStudentFeeId:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<FeePayment | null> {
    try {
      const result = await query(`
        SELECT 
          fp.*,
          s.name as student_name,
          u.name as created_by_name
        FROM fee_payments fp
        LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
        LEFT JOIN students s ON sf.student_id = s.id
        LEFT JOIN users u ON fp.created_by = u.id
        WHERE fp.id = $1
      `, [id]);
      return result.rows[0] as FeePayment || null;
    } catch (error) {
      console.error('Error in FeePaymentRepository.findById:', error);
      return null;
    }
  }

  static async create(data: Omit<FeePayment, 'id' | 'created_at'>): Promise<FeePayment | null> {
    try {
      const result = await query(
        `INSERT INTO fee_payments (student_fee_id, amount, payment_date, payment_method, notes, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, timezone('utc', now()))
         RETURNING *`,
        [data.student_fee_id, data.amount, data.payment_date, data.payment_method, data.notes, data.created_by]
      );
      return result.rows[0] as FeePayment;
    } catch (error) {
      console.error('Error in FeePaymentRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, data: Partial<Omit<FeePayment, 'id' | 'created_at'>>): Promise<FeePayment | null> {
    try {
      const result = await query(
        `UPDATE fee_payments 
         SET amount = COALESCE($2, amount),
             payment_date = COALESCE($3, payment_date),
             payment_method = COALESCE($4, payment_method),
             notes = COALESCE($5, notes)
         WHERE id = $1
         RETURNING *`,
        [id, data.amount, data.payment_date, data.payment_method, data.notes]
      );
      return result.rows[0] as FeePayment || null;
    } catch (error) {
      console.error('Error in FeePaymentRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM fee_payments WHERE id = $1', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in FeePaymentRepository.delete:', error);
      return false;
    }
  }

  static async getTotalPaidByStudentFeeId(studentFeeId: string): Promise<number> {
    try {
      const result = await query(
        'SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments WHERE student_fee_id = $1',
        [studentFeeId]
      );
      return parseFloat(result.rows[0]?.total || 0);
    } catch (error) {
      console.error('Error in FeePaymentRepository.getTotalPaidByStudentFeeId:', error);
      return 0;
    }
  }
}

export class ScheduleRepository {
  static async findByClassId(classId: string): Promise<Schedule[]> {
    try {
      const result = await query('SELECT * FROM schedule WHERE class_id = $1 ORDER BY day ASC, start_time ASC', [classId]);
      return result.rows as Schedule[];
    } catch (error) {
      console.error('Error in ScheduleRepository.findByClassId:', error);
      return [];
    }
  }
}

export class TeacherAssignmentRepository {
  static async findAll(): Promise<TeacherAssignment[]> {
    try {
      const result = await query(`
        SELECT ta.*, t.name as teacher_name, s.name as subject_name, c.name as class_name
        FROM teacher_assignments ta
        LEFT JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        LEFT JOIN classes c ON ta.class_id = c.id
        ORDER BY ta.created_at DESC
      `);
      return result.rows as TeacherAssignment[];
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<TeacherAssignment | null> {
    try {
      const result = await query(`
        SELECT ta.*, t.name as teacher_name, s.name as subject_name, c.name as class_name
        FROM teacher_assignments ta
        LEFT JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        LEFT JOIN classes c ON ta.class_id = c.id
        WHERE ta.id = $1
      `, [id]);
      return result.rows[0] as TeacherAssignment || null;
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.findById:', error);
      return null;
    }
  }

  static async findByTeacherId(teacherId: string): Promise<TeacherAssignment[]> {
    try {
      const result = await query(`
        SELECT ta.*, c.name as class_name
        FROM teacher_assignments ta
        LEFT JOIN classes c ON ta.class_id = c.id
        WHERE ta.teacher_id = $1
      `, [teacherId]);
      return result.rows as TeacherAssignment[];
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.findByTeacherId:', error);
      return [];
    }
  }

  static async create(assignment: Partial<TeacherAssignment> & Record<string, any>): Promise<TeacherAssignment | null> {
    try {
      const { teacher_id, class_id, subject_id } = assignment;
      const result = await query(
        'INSERT INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES ($1, $2, $3) RETURNING *',
        [teacher_id, class_id, subject_id]
      );
      return result.rows[0] as TeacherAssignment;
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.create:', error);
      return null;
    }
  }

  static async findByTeacherClassSubject(teacherId: string, classId: string, subjectId: string): Promise<TeacherAssignment | null> {
    try {
      const result = await query(`
        SELECT ta.*, t.name as teacher_name, s.name as subject_name, c.name as class_name
        FROM teacher_assignments ta
        LEFT JOIN teachers t ON ta.teacher_id = t.id
        LEFT JOIN subjects s ON ta.subject_id = s.id
        LEFT JOIN classes c ON ta.class_id = c.id
        WHERE ta.teacher_id = $1 AND ta.class_id = $2 AND ta.subject_id = $3
      `, [teacherId, classId, subjectId]);
      return result.rows[0] as TeacherAssignment || null;
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.findByTeacherClassSubject:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM teacher_assignments WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in TeacherAssignmentRepository.delete:', error);
      return false;
    }
  }
}

export class WeeklyScheduleRepository {
  private static formatScheduleRow(row: any): WeeklySchedule {
    return {
      ...row,
      class_name: row.class_name,
      subject_name: row.subject_name,
      teacher_name: row.teacher_name,
    } as WeeklySchedule;
  }

  static async findAll(): Promise<WeeklySchedule[]> {
    try {
      const result = await query(`
        SELECT ws.*, c.name as class_name, s.name as subject_name, t.name as teacher_name
        FROM weekly_schedule ws
        LEFT JOIN classes c ON ws.class_id = c.id
        LEFT JOIN subjects s ON ws.subject_id = s.id
        LEFT JOIN teachers t ON ws.teacher_id = t.id
        ORDER BY ws.day_of_week ASC, ws.start_time ASC
      `);
      return result.rows.map(this.formatScheduleRow);
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.findAll:', error);
      return [];
    }
  }

  static async findByClassId(classId: string): Promise<WeeklySchedule[]> {
    try {
      const result = await query(`
        SELECT ws.*, c.name as class_name, s.name as subject_name, t.name as teacher_name
        FROM weekly_schedule ws
        LEFT JOIN classes c ON ws.class_id = c.id
        LEFT JOIN subjects s ON ws.subject_id = s.id
        LEFT JOIN teachers t ON ws.teacher_id = t.id
        WHERE ws.class_id = $1
        ORDER BY ws.day_of_week ASC, ws.start_time ASC
      `, [classId]);
      return result.rows.map(this.formatScheduleRow);
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.findByClassId:', error);
      return [];
    }
  }

  static async findByTeacherId(teacherId: string): Promise<WeeklySchedule[]> {
    try {
      const result = await query(`
        SELECT ws.*, c.name as class_name, s.name as subject_name, t.name as teacher_name
        FROM weekly_schedule ws
        LEFT JOIN classes c ON ws.class_id = c.id
        LEFT JOIN subjects s ON ws.subject_id = s.id
        LEFT JOIN teachers t ON ws.teacher_id = t.id
        WHERE ws.teacher_id = $1
        ORDER BY ws.day_of_week ASC, ws.start_time ASC
      `, [teacherId]);
      return result.rows.map(this.formatScheduleRow);
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.findByTeacherId:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<WeeklySchedule | null> {
    try {
      const result = await query(`
        SELECT ws.*, c.name as class_name, s.name as subject_name, t.name as teacher_name
        FROM weekly_schedule ws
        LEFT JOIN classes c ON ws.class_id = c.id
        LEFT JOIN subjects s ON ws.subject_id = s.id
        LEFT JOIN teachers t ON ws.teacher_id = t.id
        WHERE ws.id = $1
      `, [id]);
      return result.rows[0] ? this.formatScheduleRow(result.rows[0]) : null;
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.findById:', error);
      return null;
    }
  }

  static async create(schedule: Partial<WeeklySchedule> & Record<string, any>): Promise<WeeklySchedule | null> {
    try {
      const { class_id, subject_id, teacher_id, day_of_week, start_time, end_time } = schedule;
      const result = await query(
        'INSERT INTO weekly_schedule (class_id, subject_id, teacher_id, day_of_week, start_time, end_time) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [class_id, subject_id, teacher_id, day_of_week, start_time, end_time]
      );
      return result.rows[0] as WeeklySchedule;
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.create:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM weekly_schedule WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.delete:', error);
      return false;
    }
  }

  // Check for overlapping schedules for a class
  static async hasClassOverlap(
    classId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let sql = `
        SELECT id, start_time, end_time FROM weekly_schedule
        WHERE class_id = $1 AND day_of_week = $2
      `;
      const params: any[] = [classId, dayOfWeek];
      
      if (excludeId) {
        sql += ' AND id != $3';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      
      // Check for time overlap
      return result.rows.some((record: any) => {
        const existingStart = record.start_time;
        const existingEnd = record.end_time;
        // Overlap if: new start < existing end AND new end > existing start
        return startTime < existingEnd && endTime > existingStart;
      });
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.hasClassOverlap:', error);
      return false;
    }
  }

  // Check for overlapping schedules for a teacher
  static async hasTeacherOverlap(
    teacherId: string,
    dayOfWeek: number,
    startTime: string,
    endTime: string,
    excludeId?: string
  ): Promise<boolean> {
    try {
      let sql = `
        SELECT id, start_time, end_time FROM weekly_schedule
        WHERE teacher_id = $1 AND day_of_week = $2
      `;
      const params: any[] = [teacherId, dayOfWeek];
      
      if (excludeId) {
        sql += ' AND id != $3';
        params.push(excludeId);
      }
      
      const result = await query(sql, params);
      
      // Check for time overlap
      return result.rows.some((record: any) => {
        const existingStart = record.start_time;
        const existingEnd = record.end_time;
        // Overlap if: new start < existing end AND new end > existing start
        return startTime < existingEnd && endTime > existingStart;
      });
    } catch (error) {
      console.error('Error in WeeklyScheduleRepository.hasTeacherOverlap:', error);
      return false;
    }
  }
}

export class TimeSlotRepository {
  static async findAll(): Promise<TimeSlot[]> {
    try {
      const result = await query('SELECT * FROM time_slots ORDER BY start_time ASC');
      return result.rows as TimeSlot[];
    } catch (error) {
      console.error('Error in TimeSlotRepository.findAll:', error);
      return [];
    }
  }

  static async create(timeSlot: Partial<TimeSlot> & Record<string, any>): Promise<TimeSlot | null> {
    try {
      const { start_time, end_time } = timeSlot;
      const result = await query(
        'INSERT INTO time_slots (start_time, end_time) VALUES ($1, $2) RETURNING *',
        [start_time, end_time]
      );
      return result.rows[0] as TimeSlot;
    } catch (error) {
      console.error('Error in TimeSlotRepository.create:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM time_slots WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in TimeSlotRepository.delete:', error);
      return false;
    }
  }
}

export class DashboardRepository {
  static async getStats(): Promise<DashboardStats> {
    const [totalStudents, totalTeachers, totalClasses, newComplaints] = 
      await Promise.all([
        StudentRepository.count(),
        TeacherRepository.count(),
        ClassRepository.count(),
        ComplaintRepository.countNew(),
      ]);

    const attendanceRate = await AttendanceRepository.getTodayAttendanceRate();

    // Get financial summary for pending payments calculation
    const financialSummary = await StudentFeeRepository.getFinancialSummary();
    const pendingPayments = financialSummary.total_remaining > 0 ? 1 : 0;

    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      attendanceRate,
      pendingPayments,
      newComplaints,
    };
  }
}

// New Grades System Repositories
export class ExamRepository {
  static async create(exam: Partial<Exam> & Record<string, any>): Promise<Exam | null> {
    try {
      const { name, subject_id, class_id, teacher_id, exam_date, max_score } = exam;
      const result = await query(
        'INSERT INTO exams (name, subject_id, class_id, teacher_id, exam_date, max_score) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, subject_id, class_id, teacher_id, exam_date, max_score]
      );
      return result.rows[0] as Exam;
    } catch (error) {
      console.error('Error in ExamRepository.create:', error);
      return null;
    }
  }

  static async findById(id: string): Promise<Exam | null> {
    try {
      const result = await query(`
        SELECT e.*, s.name as subject_name, c.name as class_name, t.name as teacher_name
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN classes c ON e.class_id = c.id
        LEFT JOIN teachers t ON e.teacher_id = t.id
        WHERE e.id = $1
      `, [id]);
      return result.rows[0] as Exam || null;
    } catch (error) {
      console.error('Error in ExamRepository.findById:', error);
      return null;
    }
  }

  static async findByTeacherId(teacherId: string): Promise<Exam[]> {
    try {
      const result = await query(`
        SELECT e.*, s.name as subject_name, c.name as class_name
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN classes c ON e.class_id = c.id
        WHERE e.teacher_id = $1
        ORDER BY e.exam_date DESC
      `, [teacherId]);
      return result.rows as Exam[];
    } catch (error) {
      console.error('Error in ExamRepository.findByTeacherId:', error);
      return [];
    }
  }

  static async findByClassId(classId: string): Promise<Exam[]> {
    try {
      const result = await query(`
        SELECT e.*, s.name as subject_name, t.name as teacher_name
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN teachers t ON e.teacher_id = t.id
        WHERE e.class_id = $1
        ORDER BY e.exam_date DESC
      `, [classId]);
      return result.rows as Exam[];
    } catch (error) {
      console.error('Error in ExamRepository.findByClassId:', error);
      return [];
    }
  }

  static async findAll(): Promise<Exam[]> {
    try {
      const result = await query(`
        SELECT e.*, s.name as subject_name, c.name as class_name, t.name as teacher_name
        FROM exams e
        LEFT JOIN subjects s ON e.subject_id = s.id
        LEFT JOIN classes c ON e.class_id = c.id
        LEFT JOIN teachers t ON e.teacher_id = t.id
        ORDER BY e.exam_date DESC
      `);
      return result.rows as Exam[];
    } catch (error) {
      console.error('Error in ExamRepository.findAll:', error);
      return [];
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      // Delete grades first (foreign key constraint)
      await query('DELETE FROM grades WHERE exam_id = $1', [id]);
      // Then delete exam
      const result = await query('DELETE FROM exams WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in ExamRepository.delete:', error);
      return false;
    }
  }
}

export class GradeRepository {
  static async create(grade: Partial<Grade> & Record<string, any>): Promise<Grade | null> {
    try {
      // Get active semester
      const semesterResult = await query("SELECT id FROM semesters WHERE is_active = true LIMIT 1");
      const activeSemesterId = semesterResult.rows[0]?.id;

      const { exam_id, student_id, score } = grade;
      const result = await query(
        'INSERT INTO grades (exam_id, student_id, score, semester_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [exam_id, student_id, score, activeSemesterId]
      );
      return result.rows[0] as Grade;
    } catch (error) {
      console.error('Error in GradeRepository.create:', error);
      return null;
    }
  }

  static async createMany(grades: Partial<Grade>[]): Promise<boolean> {
    try {
      // Get active semester
      const semesterResult = await query("SELECT id FROM semesters WHERE is_active = true LIMIT 1");
      const activeSemesterId = semesterResult.rows[0]?.id;

      for (const grade of grades) {
        const { exam_id, student_id, score } = grade as Partial<Grade> & Record<string, any>;
        await query(
          'INSERT INTO grades (exam_id, student_id, score, semester_id) VALUES ($1, $2, $3, $4)',
          [exam_id, student_id, score, activeSemesterId]
        );
      }
      return true;
    } catch (error) {
      console.error('Error in GradeRepository.createMany:', error);
      return false;
    }
  }

  static async upsert(grade: Partial<Grade> & Record<string, any>): Promise<Grade | null> {
    try {
      const { exam_id, student_id, score, semester_id } = grade;
      
      // Try to update first
      const updateResult = await query(`
        UPDATE grades SET score = $1, updated_at = CURRENT_TIMESTAMP
        WHERE exam_id = $2 AND student_id = $3
        RETURNING *
      `, [score, exam_id, student_id]);

      if (updateResult.rows.length > 0) {
        return updateResult.rows[0] as Grade;
      }

      // Insert new record with semester_id
      const insertResult = await query(`
        INSERT INTO grades (exam_id, student_id, score, semester_id)
        VALUES ($1, $2, $3, $4) RETURNING *
      `, [exam_id, student_id, score, semester_id]);

      return insertResult.rows[0] as Grade;
    } catch (error) {
      console.error('Error in GradeRepository.upsert:', error);
      return null;
    }
  }

  static async findByExamId(examId: string): Promise<Grade[]> {
    try {
      const result = await query(`
        SELECT g.*, s.name as student_name
        FROM grades g
        LEFT JOIN students s ON g.student_id = s.id
        WHERE g.exam_id = $1
      `, [examId]);
      return result.rows as Grade[];
    } catch (error) {
      console.error('Error in GradeRepository.findByExamId:', error);
      return [];
    }
  }

  static async findByStudentId(studentId: string): Promise<Grade[]> {
    try {
      const result = await query(`
        SELECT g.*, e.name as exam_name, e.max_score, e.exam_date, s.name as subject_name
        FROM grades g
        LEFT JOIN exams e ON g.exam_id = e.id
        LEFT JOIN subjects s ON e.subject_id = s.id
        WHERE g.student_id = $1
        ORDER BY g.created_at DESC
      `, [studentId]);
      return result.rows as Grade[];
    } catch (error) {
      console.error('Error in GradeRepository.findByStudentId:', error);
      return [];
    }
  }

  static async findByExamAndStudent(examId: string, studentId: string): Promise<Grade | null> {
    try {
      const result = await query(
        'SELECT * FROM grades WHERE exam_id = $1 AND student_id = $2',
        [examId, studentId]
      );
      return result.rows[0] as Grade || null;
    } catch (error) {
      console.error('Error in GradeRepository.findByExamAndStudent:', error);
      return null;
    }
  }

  static async update(id: string, score: number): Promise<boolean> {
    try {
      const result = await query(
        'UPDATE grades SET score = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
        [score, id]
      );
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in GradeRepository.update:', error);
      return false;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM grades WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in GradeRepository.delete:', error);
      return false;
    }
  }
}

export class AnnouncementRepository {
  static async findAll(): Promise<Announcement[]> {
    try {
      const result = await query('SELECT * FROM announcements ORDER BY created_at DESC');
      return result.rows as Announcement[];
    } catch (error) {
      console.error('Error in AnnouncementRepository.findAll:', error);
      return [];
    }
  }

  static async findByAudience(audience: string[]): Promise<Announcement[]> {
    try {
      const result = await query('SELECT * FROM announcements WHERE audience = ANY($1) ORDER BY created_at DESC', [audience]);
      return result.rows as Announcement[];
    } catch (error) {
      console.error('Error in AnnouncementRepository.findByAudience:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Announcement | null> {
    try {
      const result = await query('SELECT * FROM announcements WHERE id = $1', [id]);
      return result.rows[0] as Announcement || null;
    } catch (error) {
      console.error('Error in AnnouncementRepository.findById:', error);
      return null;
    }
  }

  static async create(announcement: Omit<Announcement, 'id' | 'created_at'> & Record<string, any>): Promise<Announcement | null> {
    try {
      const { title, content, audience, created_by } = announcement;
      const result = await query(
        'INSERT INTO announcements (title, content, audience, created_by) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, content, audience, created_by]
      );
      return result.rows[0] as Announcement;
    } catch (error) {
      console.error('Error in AnnouncementRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, announcement: Partial<Announcement> & Record<string, any>): Promise<Announcement | null> {
    try {
      const { title, content, audience } = announcement;
      const result = await query(
        'UPDATE announcements SET title = $1, content = $2, audience = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
        [title, content, audience, id]
      );
      return result.rows[0] as Announcement || null;
    } catch (error) {
      console.error('Error in AnnouncementRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM announcements WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in AnnouncementRepository.delete:', error);
      return false;
    }
  }
}

export class ComplaintRepository {
  static async findAll(): Promise<Complaint[]> {
    try {
      const result = await query(`
        SELECT 
          c.*,
          CASE 
            WHEN c.replied_by IS NOT NULL THEN admin.email
          END as replier_name
        FROM complaints c
        LEFT JOIN users admin ON c.replied_by = admin.id
        ORDER BY c.created_at DESC
      `);
      return result.rows as Complaint[];
    } catch (error) {
      console.error('Error in ComplaintRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Complaint | null> {
    try {
      const result = await query('SELECT * FROM complaints WHERE id = $1', [id]);
      return result.rows[0] as Complaint || null;
    } catch (error) {
      console.error('Error in ComplaintRepository.findById:', error);
      return null;
    }
  }

  static async create(title: string, message: string, parentId: string): Promise<Complaint | null> {
    try {
      const result = await query(
        'INSERT INTO complaints (title, message, status, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [title, message, 'pending', parentId]
      );
      return result.rows[0] as Complaint;
    } catch (error) {
      console.error('Error in ComplaintRepository.create:', error);
      return null;
    }
  }

  static async getDailyCount(parentId: string): Promise<number> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const result = await query(
        "SELECT COUNT(*) as count FROM complaints WHERE parent_id = $1 AND created_at >= $2 AND created_at < $3",
        [parentId, `${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`]
      );
      return parseInt(result.rows[0].count);
    } catch (error) {
      console.error('Error in ComplaintRepository.getDailyCount:', error);
      return 0;
    }
  }

  static async updateStatus(id: string, status: string): Promise<Complaint | null> {
    try {
      const result = await query(
        'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
      );
      return result.rows[0] as Complaint || null;
    } catch (error) {
      console.error('Error in ComplaintRepository.updateStatus:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM complaints WHERE id = $1 RETURNING *', [id]);
      return result.rowCount !== null && result.rowCount > 0;
    } catch (error) {
      console.error('Error in ComplaintRepository.delete:', error);
      return false;
    }
  }

  static async addReply(id: string, reply: string, replied_by: string): Promise<Complaint | null> {
    try {
      const result = await query(
        "UPDATE complaints SET reply = $1, replied_by = $2, replied_at = CURRENT_TIMESTAMP, status = 'resolved' WHERE id = $3 RETURNING *",
        [reply, replied_by, id]
      );
      return result.rows[0] as Complaint || null;
    } catch (error) {
      console.error('Error in ComplaintRepository.addReply:', error);
      return null;
    }
  }

  static async countNew(): Promise<number> {
    try {
      const result = await query("SELECT COUNT(*) FROM complaints WHERE status = 'pending'");
      return parseInt(result.rows[0].count, 10) || 0;
    } catch (error) {
      console.error('Error in ComplaintRepository.countNew:', error);
      return 0;
    }
  }
}

export class NewsRepository {
  static async findAll(publishedOnly: boolean = false): Promise<News[]> {
    try {
      let sql = 'SELECT * FROM news';
      if (publishedOnly) {
        sql += ' WHERE is_published = true';
      }
      sql += ' ORDER BY is_pinned DESC, created_at DESC';
      const result = await query(sql);
      return result.rows as News[];
    } catch (error) {
      console.error('Error in NewsRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string, publishedOnly: boolean = false): Promise<News | null> {
    try {
      let sql = 'SELECT * FROM news WHERE id = $1';
      const params: any[] = [id];
      if (publishedOnly) {
        sql += ' AND is_published = true';
      }
      const result = await query(sql, params);
      return result.rows[0] as News || null;
    } catch (error) {
      console.error('Error in NewsRepository.findById:', error);
      return null;
    }
  }

  static async create(news: Omit<News, 'id' | 'created_at' | 'updated_at'> & Record<string, any>): Promise<News | null> {
    try {
      const { title, summary, content, image_url, is_published, is_pinned } = news;
      const result = await query(
        `INSERT INTO news (title, summary, content, image_url, is_published, is_pinned, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [title, summary || null, content, image_url || null, is_published ?? true, is_pinned ?? false]
      );
      return result.rows[0] as News;
    } catch (error) {
      console.error('Error in NewsRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, news: Partial<News> & Record<string, any>): Promise<News | null> {
    try {
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramIndex = 1;

      if (news.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        updateValues.push(news.title);
      }
      if (news.summary !== undefined) {
        updateFields.push(`summary = $${paramIndex++}`);
        updateValues.push(news.summary);
      }
      if (news.content !== undefined) {
        updateFields.push(`content = $${paramIndex++}`);
        updateValues.push(news.content);
      }
      if (news.image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        updateValues.push(news.image_url);
      }
      if (news.is_published !== undefined) {
        updateFields.push(`is_published = $${paramIndex++}`);
        updateValues.push(news.is_published);
      }
      if (news.is_pinned !== undefined) {
        updateFields.push(`is_pinned = $${paramIndex++}`);
        updateValues.push(news.is_pinned);
      }

      if (updateFields.length === 0) {
        return null;
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      updateValues.push(id);

      const result = await query(
        `UPDATE news SET ${updateFields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        updateValues
      );
      return result.rows[0] as News || null;
    } catch (error) {
      console.error('Error in NewsRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM news WHERE id = $1 RETURNING *', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in NewsRepository.delete:', error);
      return false;
    }
  }

  static async togglePin(id: string): Promise<News | null> {
    try {
      const result = await query(
        'UPDATE news SET is_pinned = NOT is_pinned, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] as News || null;
    } catch (error) {
      console.error('Error in NewsRepository.togglePin:', error);
      return null;
    }
  }

  static async togglePublish(id: string): Promise<News | null> {
    try {
      const result = await query(
        'UPDATE news SET is_published = NOT is_published, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] as News || null;
    } catch (error) {
      console.error('Error in NewsRepository.togglePublish:', error);
      return null;
    }
  }
}

export class SemesterRepository {
  static async findAll(): Promise<Semester[]> {
    try {
      const result = await query('SELECT * FROM semesters ORDER BY start_date DESC');
      return result.rows as Semester[];
    } catch (error) {
      console.error('Error in SemesterRepository.findAll:', error);
      return [];
    }
  }

  static async findAllWithYearNames(): Promise<(Semester & { academic_year_name: string })[]> {
    try {
      const result = await query(`
        SELECT s.*, ay.name as academic_year_name
        FROM semesters s
        LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
        ORDER BY s.start_date ASC
      `);
      return result.rows as (Semester & { academic_year_name: string })[];
    } catch (error) {
      console.error('Error in SemesterRepository.findAllWithYearNames:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<Semester | null> {
    try {
      const result = await query('SELECT * FROM semesters WHERE id = $1', [id]);
      return result.rows[0] as Semester || null;
    } catch (error) {
      console.error('Error in SemesterRepository.findById:', error);
      return null;
    }
  }

  static async findByAcademicYearId(academicYearId: string): Promise<Semester[]> {
    try {
      const result = await query(
        'SELECT * FROM semesters WHERE academic_year_id = $1 ORDER BY start_date ASC',
        [academicYearId]
      );
      return result.rows as Semester[];
    } catch (error) {
      console.error('Error in SemesterRepository.findByAcademicYearId:', error);
      return [];
    }
  }

  static async create(data: { name: string; start_date: string; end_date: string; academic_year_id: string }): Promise<Semester | null> {
    try {
      const result = await query(
        'INSERT INTO semesters (name, start_date, end_date, academic_year_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [data.name, data.start_date, data.end_date, data.academic_year_id]
      );
      return result.rows[0] as Semester;
    } catch (error) {
      console.error('Error in SemesterRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, data: Partial<{ name: string; start_date: string; end_date: string }>): Promise<Semester | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.start_date !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        values.push(data.start_date);
      }
      if (data.end_date !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        values.push(data.end_date);
      }

      if (updates.length === 0) return null;

      values.push(id);

      const result = await query(
        `UPDATE semesters SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      return result.rows[0] as Semester || null;
    } catch (error) {
      console.error('Error in SemesterRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM semesters WHERE id = $1 RETURNING *', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in SemesterRepository.delete:', error);
      return false;
    }
  }

  static async setActive(id: string): Promise<Semester | null> {
    try {
      // Deactivate all semesters first
      await query('UPDATE semesters SET is_active = false');
      
      // Activate the selected semester
      const result = await query(
        'UPDATE semesters SET is_active = true WHERE id = $1 RETURNING *',
        [id]
      );
      return result.rows[0] as Semester || null;
    } catch (error) {
      console.error('Error in SemesterRepository.setActive:', error);
      return null;
    }
  }
}

export class AcademicYearRepository {
  static async findAll(): Promise<AcademicYear[]> {
    try {
      const result = await query('SELECT * FROM academic_years ORDER BY start_date DESC');
      return result.rows as AcademicYear[];
    } catch (error) {
      console.error('Error in AcademicYearRepository.findAll:', error);
      return [];
    }
  }

  static async findById(id: string): Promise<AcademicYear | null> {
    try {
      const result = await query('SELECT * FROM academic_years WHERE id = $1', [id]);
      return result.rows[0] as AcademicYear || null;
    } catch (error) {
      console.error('Error in AcademicYearRepository.findById:', error);
      return null;
    }
  }

  static async create(data: { name: string; start_date: string; end_date: string }): Promise<AcademicYear | null> {
    try {
      const result = await query(
        'INSERT INTO academic_years (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
        [data.name, data.start_date, data.end_date]
      );
      return result.rows[0] as AcademicYear;
    } catch (error) {
      console.error('Error in AcademicYearRepository.create:', error);
      return null;
    }
  }

  static async update(id: string, data: Partial<{ name: string; start_date: string; end_date: string }>): Promise<AcademicYear | null> {
    try {
      const updates: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (data.name !== undefined) {
        updates.push(`name = $${paramIndex++}`);
        values.push(data.name);
      }
      if (data.start_date !== undefined) {
        updates.push(`start_date = $${paramIndex++}`);
        values.push(data.start_date);
      }
      if (data.end_date !== undefined) {
        updates.push(`end_date = $${paramIndex++}`);
        values.push(data.end_date);
      }

      if (updates.length === 0) return null;

      updates.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);

      const result = await query(
        `UPDATE academic_years SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
        values
      );
      return result.rows[0] as AcademicYear || null;
    } catch (error) {
      console.error('Error in AcademicYearRepository.update:', error);
      return null;
    }
  }

  static async delete(id: string): Promise<boolean> {
    try {
      const result = await query('DELETE FROM academic_years WHERE id = $1 RETURNING *', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in AcademicYearRepository.delete:', error);
      return false;
    }
  }
}

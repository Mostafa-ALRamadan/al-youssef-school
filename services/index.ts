import { supabase } from '@/lib/supabase-server';
import type { Parent, TeacherAssignment, WeeklySchedule, TimeSlot, AttendanceSession, AttendanceRecord } from '@/types';
import type { User, DashboardStats, Grade, Announcement, Suggestion } from '@/types';
import {
  UserRepository,
  StudentRepository,
  ParentRepository,
  TeacherRepository,
  ClassRepository,
  SubjectRepository,
  AnnouncementRepository,
  AttendanceRepository,
  GradeRepository,
  PaymentRepository,
  ScheduleRepository,
  SuggestionRepository,
  DashboardRepository,
  TeacherAssignmentRepository,
  WeeklyScheduleRepository,
  TimeSlotRepository,
  ExamRepository,
} from '@/repositories';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class TeacherService {
  static async getAllTeachers() {
    return await TeacherRepository.findAll();
  }

  static async getTeacherById(id: string) {
    return await TeacherRepository.findById(id);
  }

  static async createTeacher(teacherData: { email: string; name: string; specialization?: string; phone?: string }) {
    // First create the user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: teacherData.email,
      password: 'temp_password_123', // Should be generated and sent via email
      options: {
        data: {
          name: teacherData.name,
          role: 'teacher',
        },
      },
    });

    if (authError) throw authError;

    // Then create the teacher record
    const teacher = await TeacherRepository.create({
      user_id: authData.user!.id,
      name: teacherData.name,
      phone: teacherData.phone,
    });

    return teacher;
  }

  static async updateTeacher(id: string, updates: Parameters<typeof TeacherRepository.update>[1]) {
    return await TeacherRepository.update(id, updates);
  }

  static async deleteTeacher(id: string) {
    return await TeacherRepository.delete(id);
  }

  static async getTotalCount() {
    return await TeacherRepository.count();
  }
}

export class StudentService {
  static async getAllStudents() {
    return await StudentRepository.findAll();
  }

  static async getStudentById(id: string) {
    return await StudentRepository.findById(id);
  }

  static async getStudentsByClass(classId: string) {
    return await StudentRepository.findByClassId(classId);
  }

  static async createStudent(studentData: { 
    name: string; 
    class_id: string; 
    parent_name: string; 
    parent_email: string;
    parent_password?: string;
    parent_phone: string;
    parent_address?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female';
  }) {
    // First try to find parent by phone
    let parent = await ParentRepository.findByPhone(studentData.parent_phone);
    
    if (!parent) {
      // Check if a user already exists with this email in the users table
      const { data: existingUser } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', studentData.parent_email)
        .single();
      
      if (existingUser) {
        // User exists, find parent by user_id
        const { data: existingParent } = await supabase
          .from('parents')
          .select('*')
          .eq('user_id', existingUser.id)
          .single();
        
        if (existingParent) {
          parent = existingParent as Parent;
        } else {
          // User exists but no parent record - create parent record with existing user_id
          parent = await ParentRepository.create(
            {
              name: studentData.parent_name,
              phone: studentData.parent_phone,
              address: studentData.parent_address,
            },
            studentData.parent_email,
            studentData.parent_password || '',
            existingUser.id
          );
        }
      } else {
        // No user exists, create new parent with auth user
        parent = await ParentRepository.create(
          {
            name: studentData.parent_name,
            phone: studentData.parent_phone,
            address: studentData.parent_address,
          },
          studentData.parent_email,
          studentData.parent_password || ''
        );
      }
    }

    if (!parent) {
      throw new Error('فشل إنشاء أو العثور على ولي الأمر');
    }

    const student = await StudentRepository.create({
      name: studentData.name,
      class_id: studentData.class_id,
      parent_id: parent.id,
      date_of_birth: studentData.date_of_birth,
      gender: studentData.gender,
    });

    return student;
  }

  static async updateStudent(id: string, updates: { 
    name?: string; 
    class_id?: string; 
    parent_name?: string; 
    parent_email?: string;
    parent_password?: string;
    parent_phone?: string;
    parent_address?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female';
  }) {
    // Get current student to find parent
    const student = await StudentRepository.findById(id);
    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    const oldParentId = student.parent_id;
    let parentId = student.parent_id;
    let parentChanged = false;
    
    // If parent phone is being updated, check if it belongs to a different existing parent
    if (updates.parent_phone) {
      const existingParent = await ParentRepository.findByPhone(updates.parent_phone);
      const currentParent = student.parent_id ? await ParentRepository.findById(student.parent_id) : null;
      
      if (existingParent && existingParent.id !== student.parent_id) {
        // Phone belongs to a different parent - link student to this parent
        parentId = existingParent.id;
        parentChanged = true;
        
        // Optionally update email of the existing parent if provided
        if (updates.parent_email && existingParent.user_id) {
          await supabase
            .from('users')
            .update({ email: updates.parent_email })
            .eq('id', existingParent.user_id);
          
          // Update auth user email
          await supabase.auth.admin.updateUserById(
            existingParent.user_id,
            { email: updates.parent_email }
          );
        }
      } else if (existingParent && existingParent.id === student.parent_id) {
        // Same parent - update their info
        const parentUpdates: any = {};
        if (updates.parent_name) parentUpdates.name = updates.parent_name;
        if (updates.parent_phone) parentUpdates.phone = updates.parent_phone;
        if (updates.parent_address) parentUpdates.address = updates.parent_address;
        
        await ParentRepository.update(existingParent.id, parentUpdates);
        
        if (updates.parent_email && existingParent.user_id) {
          await supabase.auth.admin.updateUserById(
            existingParent.user_id,
            { email: updates.parent_email }
          );
          await supabase.from('users').update({ email: updates.parent_email }).eq('id', existingParent.user_id);
        }
      } else if (!existingParent && currentParent) {
        // New phone number doesn't exist - update current parent's phone
        const parentUpdates: any = {};
        if (updates.parent_name) parentUpdates.name = updates.parent_name;
        parentUpdates.phone = updates.parent_phone;
        if (updates.parent_address) parentUpdates.address = updates.parent_address;
        
        await ParentRepository.update(currentParent.id, parentUpdates);
        
        if (updates.parent_email && currentParent.user_id) {
          await supabase.auth.admin.updateUserById(
            currentParent.user_id,
            { email: updates.parent_email }
          );
          await supabase.from('users').update({ email: updates.parent_email }).eq('id', currentParent.user_id);
        }
      }
    }

    // Update student with potentially new parent_id
    const result = await StudentRepository.update(id, {
      name: updates.name,
      class_id: updates.class_id,
      parent_id: parentId,
      date_of_birth: updates.date_of_birth,
      gender: updates.gender,
    });

    // If parent changed, check if old parent has other students and clean up if orphaned
    if (parentChanged && oldParentId) {
      const siblings = await StudentRepository.findByParentId(oldParentId);
      if (siblings.length === 0) {
        // Old parent has no other students - delete orphaned parent
        const oldParent = await ParentRepository.findById(oldParentId);
        if (oldParent && oldParent.user_id) {
          await ParentRepository.delete(oldParent.id);
          await supabase.from('users').delete().eq('id', oldParent.user_id);
          await supabase.auth.admin.deleteUser(oldParent.user_id);
        }
      }
    }

    return result;
  }

  static async deleteStudent(id: string) {
    // Get student to find parent
    const student = await StudentRepository.findById(id);
    if (!student) {
      throw new Error('الطالب غير موجود');
    }

    // Delete student's related records first (grades, attendance, etc.)
    // TODO: Delete related records

    // Delete the student
    await StudentRepository.delete(id);

    // Check if parent has other students
    if (student.parent_id) {
      const siblings = await StudentRepository.findByParentId(student.parent_id);
      if (siblings.length === 0) {
        // Parent has no other students, safe to delete parent
        const parent = await ParentRepository.findById(student.parent_id);
        if (parent && parent.user_id) {
          // Delete parent record
          await ParentRepository.delete(parent.id);
          // Delete from public users table
          await supabase.from('users').delete().eq('id', parent.user_id);
          // Delete from auth users table
          const { error: authDeleteError } = await supabase.auth.admin.deleteUser(parent.user_id);
          if (authDeleteError) {
            console.error('Auth user deletion error:', authDeleteError);
          }
        }
      }
    }

    return { success: true };
  }

  static async getTotalCount() {
    return await StudentRepository.count();
  }
}

export class ClassService {
  static async getAllClasses() {
    return await ClassRepository.findAll();
  }

  static async getClassById(id: string) {
    return await ClassRepository.findById(id);
  }

  static async createClass(classData: Parameters<typeof ClassRepository.create>[0]) {
    return await ClassRepository.create(classData);
  }

  static async updateClass(id: string, updates: Parameters<typeof ClassRepository.update>[1]) {
    return await ClassRepository.update(id, updates);
  }

  static async deleteClass(id: string) {
    return await ClassRepository.delete(id);
  }

  static async getTotalCount() {
    return await ClassRepository.count();
  }
}

export class SubjectService {
  static async getAllSubjects() {
    return await SubjectRepository.findAll();
  }

  static async getSubjectById(id: string) {
    return await SubjectRepository.findById(id);
  }

  static async createSubject(subjectData: Parameters<typeof SubjectRepository.create>[0]) {
    return await SubjectRepository.create(subjectData);
  }

  static async updateSubject(id: string, updates: Parameters<typeof SubjectRepository.update>[1]) {
    return await SubjectRepository.update(id, updates);
  }

  static async deleteSubject(id: string) {
    return await SubjectRepository.delete(id);
  }
}

export class AttendanceService {
  // Get or create attendance session for a schedule on a specific date
  static async getOrCreateSession(scheduleId: string, date: string) {
    return await AttendanceRepository.findOrCreateSession(scheduleId, date);
  }

  // Get attendance records for a session
  static async getSessionRecords(sessionId: string) {
    return await AttendanceRepository.findRecordsBySessionId(sessionId);
  }

  // Save attendance record
  static async saveRecord(record: Partial<AttendanceRecord>) {
    return await AttendanceRepository.upsertRecord(record);
  }

  // Get today's lessons for a teacher with attendance status
  static async getTeacherTodayLessons(teacherId: string, date: string) {
    // Get all teacher's schedules
    const allSchedules = await WeeklyScheduleRepository.findByTeacherId(teacherId);

    // Filter schedules for today based on day_of_week
    // date format: YYYY-MM-DD, get day of week (0=Sunday, 5=Friday)
    const dayOfWeek = new Date(date).getDay();
    const todaySchedules = allSchedules.filter(schedule => schedule.day_of_week === dayOfWeek);

    // For each schedule, get or create attendance session
    const lessonsWithSessions = await Promise.all(
      todaySchedules.map(async (schedule) => {
        const session = await AttendanceRepository.findOrCreateSession(schedule.id, date);
        // Check if there are actual attendance records for this session
        const records = session ? await AttendanceRepository.findRecordsBySessionId(session.id) : [];
        return {
          ...schedule,
          session_id: session?.id,
          has_attendance: records.length > 0,
        };
      })
    );

    return lessonsWithSessions;
  }

  // Get students for attendance marking
  static async getStudentsForAttendance(scheduleId: string, date: string) {
    // Get or create session
    const session = await AttendanceRepository.findOrCreateSession(scheduleId, date);
    if (!session) {
      return { session: null, students: [], records: [] };
    }

    // Get schedule to find class_id
    const schedule = await WeeklyScheduleRepository.findById(scheduleId);
    if (!schedule) {
      return { session, students: [], records: [] };
    }

    // Get students from the class
    const students = await StudentRepository.findByClassId(schedule.class_id);

    // Get existing records
    const records = await AttendanceRepository.findRecordsBySessionId(session.id);

    return { session, students, records };
  }

  // Get attendance by class and date
  static async getClassAttendance(classId: string, date: string) {
    return await AttendanceRepository.findByClassAndDate(classId, date);
  }

  // Get student attendance history
  static async getStudentHistory(studentId: string) {
    return await AttendanceRepository.findByStudentId(studentId);
  }

  // Get today's attendance rate for dashboard
  static async getTodayAttendanceRate() {
    return await AttendanceRepository.getTodayAttendanceRate();
  }
}

export class PaymentService {
  static async getAllPayments() {
    return await PaymentRepository.findAll();
  }

  static async getPendingPayments() {
    return await PaymentRepository.findPending();
  }

  static async getPendingCount() {
    return await PaymentRepository.countPending();
  }
}

export class ScheduleService {
  static async getClassSchedule(classId: string) {
    return await ScheduleRepository.findByClassId(classId);
  }
}

export class SuggestionService {
  static async getAllSuggestions(): Promise<Suggestion[]> {
    return await SuggestionRepository.findAll();
  }

  static async getSuggestionById(id: string): Promise<Suggestion | null> {
    return await SuggestionRepository.findById(id);
  }

  static async submitSuggestion(suggestion: Omit<Suggestion, 'id' | 'created_at' | 'status'>): Promise<Suggestion | null> {
    return await SuggestionRepository.create(suggestion);
  }

  static async updateSuggestionStatus(id: string, status: Suggestion['status']): Promise<Suggestion | null> {
    return await SuggestionRepository.updateStatus(id, status);
  }

  static async deleteSuggestion(id: string): Promise<boolean> {
    return await SuggestionRepository.delete(id);
  }

  static async addReply(id: string, reply: string, replied_by?: string): Promise<Suggestion | null> {
    return await SuggestionRepository.addReply(id, reply, replied_by);
  }
}

export class DashboardService {
  static async getDashboardStats(): Promise<DashboardStats> {
    return await DashboardRepository.getStats();
  }
}

export class TeacherAssignmentService {
  static async getAllAssignments() {
    return await TeacherAssignmentRepository.findAll();
  }

  static async getAssignmentById(id: string) {
    return await TeacherAssignmentRepository.findById(id);
  }

  static async findByTeacherClassSubject(teacherId: string, classId: string, subjectId: string) {
    return await TeacherAssignmentRepository.findByTeacherClassSubject(teacherId, classId, subjectId);
  }

  static async createAssignment(assignment: Partial<TeacherAssignment>) {
    return await TeacherAssignmentRepository.create(assignment);
  }

  static async deleteAssignment(id: string) {
    return await TeacherAssignmentRepository.delete(id);
  }
}

export class WeeklyScheduleService {
  static async getAllSchedules() {
    return await WeeklyScheduleRepository.findAll();
  }

  static async getSchedulesByClassId(classId: string) {
    return await WeeklyScheduleRepository.findByClassId(classId);
  }

  static async getSchedulesByTeacherId(teacherId: string) {
    return await WeeklyScheduleRepository.findByTeacherId(teacherId);
  }

  static async createSchedule(schedule: Partial<WeeklySchedule>) {
    // Check for class overlap
    const hasClassOverlap = await WeeklyScheduleRepository.hasClassOverlap(
      schedule.class_id!,
      schedule.day_of_week!,
      schedule.start_time!,
      schedule.end_time!
    );

    if (hasClassOverlap) {
      throw new Error('تعارض في وقت الحصة: هذا الصف لديه حصة أخرى في نفس الوقت');
    }

    // Check for teacher overlap
    const hasTeacherOverlap = await WeeklyScheduleRepository.hasTeacherOverlap(
      schedule.teacher_id!,
      schedule.day_of_week!,
      schedule.start_time!,
      schedule.end_time!
    );

    if (hasTeacherOverlap) {
      throw new Error('تعارض في وقت الحصة: المعلم يدرس حصة أخرى في نفس الوقت');
    }

    return await WeeklyScheduleRepository.create(schedule);
  }

  static async deleteSchedule(id: string) {
    return await WeeklyScheduleRepository.delete(id);
  }
}

export class TeacherStudentService {
  static async getStudentsForTeacher(teacherId: string) {
    // Get teacher's assigned classes
    const assignments = await TeacherAssignmentRepository.findByTeacherId(teacherId);
    const classIds = [...new Set(assignments.map(a => a.class_id).filter(Boolean))];
    
    if (classIds.length === 0) {
      return { students: [], classes: [] };
    }
    
    // Get students from those classes
    const students = await StudentRepository.findByClassIds(classIds);
    
    // Get unique classes for the filter dropdown
    const classes = [...new Set(assignments.map(a => ({ id: a.class_id, name: a.class_name })).filter(c => c.id))];
    
    return { students, classes };
  }
}

export class TimeSlotService {
  static async getAllTimeSlots() {
    return await TimeSlotRepository.findAll();
  }

  static async createTimeSlot(timeSlot: Partial<TimeSlot>) {
    return await TimeSlotRepository.create(timeSlot);
  }

  static async deleteTimeSlot(id: string) {
    return await TimeSlotRepository.delete(id);
  }
}

// Export AuthService from separate file
export { AuthService } from './auth';

// New Grades System Services
export class ExamService {
  static async createExam(exam: { class_id: string; subject_id: string; teacher_id: string; name: string; max_score: number; exam_date: string }) {
    return await ExamRepository.create(exam);
  }

  static async getExamById(id: string) {
    const exam = await ExamRepository.findById(id);
    if (!exam) return null;

    // Get grades with student details
    const grades = await GradeRepository.findByExamId(id);

    return {
      ...exam,
      grades,
    };
  }

  static async getExamsByTeacher(teacherId: string) {
    return await ExamRepository.findByTeacherId(teacherId);
  }

  static async getExamsByClass(classId: string) {
    return await ExamRepository.findByClassId(classId);
  }

  static async getAllExams() {
    return await ExamRepository.findAll();
  }

  static async deleteExam(id: string) {
    return await ExamRepository.delete(id);
  }
}

export class GradeService {
  static async createGrade(grade: { exam_id: string; student_id: string; score: number }) {
    // Validate score doesn't exceed max
    const exam = await ExamRepository.findById(grade.exam_id);
    if (!exam) {
      throw new Error('الامتحان غير موجود');
    }
    if (grade.score > exam.max_score) {
      throw new Error(`الدرجة يجب ألا تتجاوز ${exam.max_score}`);
    }

    return await GradeRepository.upsert(grade);
  }

  static async createManyGrades(examId: string, grades: { student_id: string; score: number }[]) {
    // Validate score doesn't exceed max
    const exam = await ExamRepository.findById(examId);
    if (!exam) {
      throw new Error('الامتحان غير موجود');
    }

    // Check all scores are within limit
    for (const grade of grades) {
      if (grade.score > exam.max_score) {
        throw new Error(`الدرجة يجب ألا تتجاوز ${exam.max_score}`);
      }
    }

    const gradesWithExamId = grades.map(g => ({
      ...g,
      exam_id: examId,
    }));

    return await GradeRepository.createMany(gradesWithExamId);
  }

  static async saveGrades(examId: string, grades: { student_id: string; score: number }[]) {
    const exam = await ExamRepository.findById(examId);
    if (!exam) {
      throw new Error('الامتحان غير موجود');
    }

    // Validate all scores
    for (const grade of grades) {
      if (grade.score > exam.max_score) {
        throw new Error(`الدرجة يجب ألا تتجاوز ${exam.max_score}`);
      }
      if (grade.score < 0) {
        throw new Error('الدرجة يجب ألا تكون سالبة');
      }
    }

    // Get active semester
    const { supabase } = await import('@/lib/supabase-server');
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    // Upsert each grade (update if exists, create if not)
    const results = [];
    for (const grade of grades) {
      const result = await GradeRepository.upsert({
        exam_id: examId,
        student_id: grade.student_id,
        score: grade.score,
        semester_id: activeSemester?.id,
      });
      results.push(result);
    }

    return results;
  }

  static async getGradesByExam(examId: string) {
    return await GradeRepository.findByExamId(examId);
  }

  static async getGradesByStudent(studentId: string) {
    return await GradeRepository.findByStudentId(studentId);
  }

  static async getStudentGradeHistory(studentId: string) {
    const grades = await GradeRepository.findByStudentId(studentId);
    return grades.map((grade: any) => ({
      ...grade,
      percentage: grade.max_score ? (grade.score / grade.max_score) * 100 : 0,
    }));
  }

  static async updateGrade(id: string, score: number) {
    return await GradeRepository.update(id, score);
  }

  static async deleteGrade(id: string) {
    return await GradeRepository.delete(id);
  }

  // Legacy methods for backwards compatibility
  static async getStudentGrades(studentId: string) {
    return await GradeRepository.findByStudentId(studentId);
  }

  static async recordGrade(gradeData: Partial<Grade>) {
    return await GradeRepository.create(gradeData);
  }
}

export class AnnouncementService {
  static async getAllAnnouncements(): Promise<Announcement[]> {
    return await AnnouncementRepository.findAll();
  }

  static async getAnnouncementsForTeacher(): Promise<Announcement[]> {
    return await AnnouncementRepository.findByAudience(['all', 'teachers']);
  }

  static async getAnnouncementsForParents(): Promise<Announcement[]> {
    return await AnnouncementRepository.findByAudience(['all', 'parents']);
  }

  static async getAnnouncementById(id: string): Promise<Announcement | null> {
    return await AnnouncementRepository.findById(id);
  }

  static async createAnnouncement(announcement: Omit<Announcement, 'id' | 'created_at'>): Promise<Announcement | null> {
    // Validate required fields
    if (!announcement.title || !announcement.content || !announcement.audience) {
      throw new Error('Title, content, and audience are required');
    }

    // Validate audience value
    const validAudiences = ['all', 'teachers', 'parents'];
    if (!validAudiences.includes(announcement.audience)) {
      throw new Error('Invalid audience value');
    }

    return await AnnouncementRepository.create(announcement);
  }

  static async updateAnnouncement(id: string, announcement: Partial<Announcement>): Promise<Announcement | null> {
    // Validate audience value if provided
    if (announcement.audience) {
      const validAudiences = ['all', 'teachers', 'parents'];
      if (!validAudiences.includes(announcement.audience)) {
        throw new Error('Invalid audience value');
      }
    }

    return await AnnouncementRepository.update(id, announcement);
  }

  static async deleteAnnouncement(id: string): Promise<boolean> {
    return await AnnouncementRepository.delete(id);
  }
}

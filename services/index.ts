import type { Parent, TeacherAssignment, WeeklySchedule, TimeSlot, AttendanceSession, AttendanceRecord } from '@/types';
import type { User, DashboardStats, Grade, Announcement, Complaint, News, StudentFee, FeePayment, PaymentMethod, PaymentSummary } from '@/types';
import {
  StudentRepository,
  ParentRepository,
  TeacherRepository,
  ClassRepository,
  SubjectRepository,
  AcademicYearRepository,
  SemesterRepository,
  AnnouncementRepository,
  AttendanceRepository,
  GradeRepository,
  StudentFeeRepository,
  FeePaymentRepository,
  ScheduleRepository,
  ComplaintRepository,
  DashboardRepository,
  TeacherAssignmentRepository,
  WeeklyScheduleRepository,
  TimeSlotRepository,
  ExamRepository,
  NewsRepository,
} from '@/repositories';
import { query } from '@/lib/db';
import bcrypt from 'bcrypt';

export class TeacherService {
  static async getAllTeachers() {
    return await TeacherRepository.findAll();
  }

  static async getTeacherById(id: string) {
    return await TeacherRepository.findById(id);
  }

  static async createTeacher(teacherData: { email: string; name: string; specialization?: string; phone?: string; subject?: string }) {
    try {
      // Generate UUID for new user
      const uuidResult = await query('SELECT gen_random_uuid() as uuid');
      const userId = uuidResult.rows[0].uuid;
      
      // Hash the temporary password
      const hashedPassword = await bcrypt.hash('temp_password_123', 10);
      
      // Create user record in users table
      await query(
        'INSERT INTO users (id, email, password_hash, role, name) VALUES ($1, $2, $3, $4, $5)',
        [userId, teacherData.email, hashedPassword, 'teacher', teacherData.name]
      );

      // Then create the teacher record
      const teacher = await TeacherRepository.create({
        id: userId,
        user_id: userId,
        name: teacherData.name,
        phone: teacherData.phone,
        subject: teacherData.subject || teacherData.specialization,
      });

      return teacher;
    } catch (error) {
      console.error('Error in TeacherService.createTeacher:', error);
      throw error;
    }
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
    parent_password?: string;
    parent_phone: string;
    parent_address?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female';
  }) {
    // First try to find parent by phone
    let parent = await ParentRepository.findByPhone(studentData.parent_phone);
    
    if (!parent) {
      // Generate a hidden auth_email for the parent
      const timestamp = Date.now();
      const randomStr = Math.random().toString(36).substring(2, 8);
      const authEmail = `parent_${timestamp}_${randomStr}@alyoussef.local`;
      
      // Create new parent with auth user
      parent = await ParentRepository.create(
        {
          name: studentData.parent_name,
          phone: studentData.parent_phone,
          address: studentData.parent_address,
        },
        authEmail,
        studentData.parent_password || ''
      );
    }

    if (!parent) {
      throw new Error('فشل إنشاء أو العثور على ولي الأمر');
    }

    // Generate login_name for the student (triple name format)
    // Example: "عمر علي عبده" (student name + parent name components)
    const parentNameParts = studentData.parent_name.trim().split(/\s+/);
    const studentFirstName = studentData.name.trim().split(/\s+/)[0];
    
    // Create triple name: student first name + parent first name + parent last name (if available)
    let loginName = studentData.name;
    if (parentNameParts.length >= 2) {
      loginName = `${studentFirstName} ${parentNameParts[0]} ${parentNameParts[parentNameParts.length - 1]}`;
    } else if (parentNameParts.length === 1) {
      loginName = `${studentFirstName} ${parentNameParts[0]}`;
    }
    
    // Ensure uniqueness by appending a number if needed
    let finalLoginName = loginName;
    let counter = 1;
    while (true) {
      const existing = await StudentRepository.findByLoginName(finalLoginName);
      if (!existing) break;
      finalLoginName = `${loginName} ${counter}`;
      counter++;
    }

    const student = await StudentRepository.create({
      name: studentData.name,
      login_name: finalLoginName,
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
      } else if (existingParent && existingParent.id === student.parent_id) {
        // Same parent - update their info
        const parentUpdates: any = {};
        if (updates.parent_name) parentUpdates.name = updates.parent_name;
        if (updates.parent_phone) parentUpdates.phone = updates.parent_phone;
        if (updates.parent_address) parentUpdates.address = updates.parent_address;
        
        await ParentRepository.update(existingParent.id, parentUpdates);
      } else if (!existingParent && currentParent) {
        // New phone number doesn't exist - update current parent's phone
        const parentUpdates: any = {};
        if (updates.parent_name) parentUpdates.name = updates.parent_name;
        parentUpdates.phone = updates.parent_phone;
        if (updates.parent_address) parentUpdates.address = updates.parent_address;
        
        await ParentRepository.update(currentParent.id, parentUpdates);
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
          // Delete from users table
          await query('DELETE FROM users WHERE id = $1', [oldParent.user_id]);
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
          // Delete from users table
          await query('DELETE FROM users WHERE id = $1', [parent.user_id]);
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

  static async deleteClass(id: string): Promise<{ success: boolean; error?: string }> {
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

export class AcademicYearService {
  static async getAllAcademicYears() {
    return await AcademicYearRepository.findAll();
  }

  static async getAcademicYearById(id: string) {
    return await AcademicYearRepository.findById(id);
  }

  static async createAcademicYear(data: { name: string; start_date: string; end_date: string }) {
    return await AcademicYearRepository.create(data);
  }

  static async updateAcademicYear(id: string, data: Partial<{ name: string; start_date: string; end_date: string }>) {
    return await AcademicYearRepository.update(id, data);
  }

  static async deleteAcademicYear(id: string) {
    return await AcademicYearRepository.delete(id);
  }

  static async deleteAcademicYearWithSemesters(id: string): Promise<boolean> {
    try {
      // Delete related semesters first (cascade will handle this, but let's be explicit)
      await query('DELETE FROM semesters WHERE academic_year_id = $1', [id]);

      // Delete the academic year
      const result = await query('DELETE FROM academic_years WHERE id = $1 RETURNING *', [id]);
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.error('Error in deleteAcademicYearWithSemesters:', error);
      return false;
    }
  }

  static async setActiveAcademicYear(yearId: string): Promise<boolean> {
    try {
      // Deactivate all academic years
      await query('UPDATE academic_years SET is_active = false');

      // Deactivate all semesters
      await query('UPDATE semesters SET is_active = false');

      // Activate the selected year
      await query(
        'UPDATE academic_years SET is_active = true WHERE id = $1',
        [yearId]
      );

      // Activate the first semester of this year (if any exists)
      await query(
        `UPDATE semesters SET is_active = true 
         WHERE id = (SELECT id FROM semesters WHERE academic_year_id = $1 ORDER BY start_date LIMIT 1)`,
        [yearId]
      );

      return true;
    } catch (error) {
      console.error('Error in setActiveAcademicYear:', error);
      return false;
    }
  }
}

export class SemesterService {
  static async getAllSemesters() {
    return await SemesterRepository.findAll();
  }

  static async getAllSemestersWithYearNames() {
    return await SemesterRepository.findAllWithYearNames();
  }

  static async getSemesterById(id: string) {
    return await SemesterRepository.findById(id);
  }

  static async getSemestersByAcademicYearId(academicYearId: string) {
    return await SemesterRepository.findByAcademicYearId(academicYearId);
  }

  static async createSemester(data: { name: string; start_date: string; end_date: string; academic_year_id: string }) {
    return await SemesterRepository.create(data);
  }

  static async updateSemester(id: string, data: Partial<{ name: string; start_date: string; end_date: string }>) {
    return await SemesterRepository.update(id, data);
  }

  static async deleteSemester(id: string) {
    return await SemesterRepository.delete(id);
  }

  static async setActiveSemester(id: string) {
    return await SemesterRepository.setActive(id);
  }

  static async setActiveSemesterWithYear(semesterId: string): Promise<boolean> {
    try {
      const semester = await SemesterRepository.findById(semesterId);
      if (!semester) return false;

      // Deactivate all academic years and semesters
      await query('UPDATE academic_years SET is_active = false');
      await query('UPDATE semesters SET is_active = false');

      // Activate the semester's academic year
      await query(
        'UPDATE academic_years SET is_active = true WHERE id = $1',
        [semester.academic_year_id]
      );

      // Activate the semester
      await query(
        'UPDATE semesters SET is_active = true WHERE id = $1',
        [semesterId]
      );

      return true;
    } catch (error) {
      console.error('Error in setActiveSemesterWithYear:', error);
      return false;
    }
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

    // For each schedule, only FIND existing sessions (don't create)
    const lessonsWithSessions = await Promise.all(
      todaySchedules.map(async (schedule) => {
        const session = await AttendanceRepository.findSession(schedule.id, date);
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
    // Find existing session only (don't create)
    const session = await AttendanceRepository.findSession(scheduleId, date);

    // Get schedule to find class_id
    const schedule = await WeeklyScheduleRepository.findById(scheduleId);
    if (!schedule) {
      return { session, students: [], records: [] };
    }

    // Get students from the class
    const students = await StudentRepository.findByClassId(schedule.class_id);

    // Get existing records if session exists
    const records = session ? await AttendanceRepository.findRecordsBySessionId(session.id) : [];

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

export class StudentFeeService {
  static async getAllFees(): Promise<StudentFee[]> {
    const fees = await StudentFeeRepository.findAll();
    // Calculate payment summaries for each fee
    return Promise.all(fees.map(async (fee) => this.calculatePaymentSummary(fee)));
  }

  static async getFeeById(id: string): Promise<StudentFee | null> {
    const fee = await StudentFeeRepository.findById(id);
    if (!fee) return null;
    return this.calculatePaymentSummary(fee);
  }

  static async getFeesByStudentId(studentId: string): Promise<StudentFee[]> {
    const fees = await StudentFeeRepository.findByStudentId(studentId);
    return Promise.all(fees.map(async (fee) => this.calculatePaymentSummary(fee)));
  }

  static async getOrCreateStudentFee(
    studentId: string,
    academicYearId: string
  ): Promise<StudentFee | null> {
    let fee = await StudentFeeRepository.findByStudentAndYear(studentId, academicYearId);
    if (!fee) {
      fee = await StudentFeeRepository.create({
        student_id: studentId,
        academic_year_id: academicYearId,
        school_fee: 0,
        transport_fee: 0,
      });
    }
    return fee ? this.calculatePaymentSummary(fee) : null;
  }

  static async createStudentFee(data: Omit<StudentFee, 'id' | 'created_at' | 'updated_at'>): Promise<StudentFee | null> {
    const fee = await StudentFeeRepository.create(data);
    return fee ? this.calculatePaymentSummary(fee) : null;
  }

  static async updateStudentFee(id: string, data: Partial<Omit<StudentFee, 'id' | 'created_at' | 'updated_at'>>): Promise<StudentFee | null> {
    const fee = await StudentFeeRepository.update(id, data);
    if (!fee) return null;
    return this.calculatePaymentSummary(fee);
  }

  static async deleteStudentFee(id: string): Promise<boolean> {
    return await StudentFeeRepository.delete(id);
  }

  static async getPaymentHistory(studentFeeId: string): Promise<FeePayment[]> {
    return await FeePaymentRepository.findByStudentFeeId(studentFeeId);
  }

  static async addPayment(
    studentFeeId: string,
    amount: number,
    paymentDate: string,
    paymentMethod: PaymentMethod,
    notes?: string,
    createdBy?: string
  ): Promise<{ success: boolean; payment?: FeePayment; error?: string }> {
    // Get the student fee to check remaining balance
    const fee = await StudentFeeRepository.findById(studentFeeId);
    if (!fee) {
      return { success: false, error: 'لم يتم العثور على بيانات الأقساط' };
    }

    // Calculate total fees and current payments
    const totalFees = fee.school_fee + fee.transport_fee;
    const totalPaid = await FeePaymentRepository.getTotalPaidByStudentFeeId(studentFeeId);
    const remainingBalance = totalFees - totalPaid;

    // Check if payment amount exceeds remaining balance
    if (amount > remainingBalance) {
      return {
        success: false,
        error: `المبلغ المدفوع (${amount}) يتجاوز الرصيد المتبقي (${remainingBalance})`,
      };
    }

    // Create the payment
    const payment = await FeePaymentRepository.create({
      student_fee_id: studentFeeId,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod,
      notes,
      created_by: createdBy,
    });

    if (!payment) {
      return { success: false, error: 'فشل في إضافة الدفعة' };
    }

    return { success: true, payment };
  }

  static async updatePayment(
    paymentId: string,
    data: Partial<Omit<FeePayment, 'id' | 'created_at'>>
  ): Promise<FeePayment | null> {
    return await FeePaymentRepository.update(paymentId, data);
  }

  static async deletePayment(paymentId: string): Promise<boolean> {
    return await FeePaymentRepository.delete(paymentId);
  }

  static async getFinancialSummary(): Promise<PaymentSummary> {
    return await StudentFeeRepository.getFinancialSummary();
  }

  // Helper method to calculate payment summary for a student fee
  private static async calculatePaymentSummary(fee: StudentFee): Promise<StudentFee> {
    const totalFees = fee.school_fee + fee.transport_fee;
    const totalPaid = await FeePaymentRepository.getTotalPaidByStudentFeeId(fee.id);
    const remainingBalance = totalFees - totalPaid;

    return {
      ...fee,
      total_fees: totalFees,
      total_paid: totalPaid,
      remaining_balance: remainingBalance,
    };
  }
}

export class ScheduleService {
  static async getClassSchedule(classId: string) {
    return await ScheduleRepository.findByClassId(classId);
  }
}

export class ComplaintService {
  static async getAllComplaints(): Promise<Complaint[]> {
    return await ComplaintRepository.findAll();
  }

  static async getComplaintById(id: string): Promise<Complaint | null> {
    return await ComplaintRepository.findById(id);
  }

  static async getDailyComplaintCount(parentId: string): Promise<number> {
    return await ComplaintRepository.getDailyCount(parentId);
  }

  static async submitComplaint(
    title: string,
    message: string,
    parentId: string
  ): Promise<Complaint | null> {
    return await ComplaintRepository.create(title, message, parentId);
  }

  static async updateComplaintStatus(
    id: string,
    status: string
  ): Promise<Complaint | null> {
    // Map Arabic status values to English DB status
    const statusMap: Record<string, string> = {
      'معلق': 'pending',
      'تم المراجعة': 'in_progress',
      'تم التنفيذ': 'resolved',
      'مرفوض': 'closed',
      'pending': 'pending',
      'in_progress': 'in_progress',
      'resolved': 'resolved',
      'closed': 'closed',
    };

    const dbStatus = statusMap[status];
    if (!dbStatus) {
      throw new Error('Invalid status');
    }

    return await ComplaintRepository.updateStatus(id, dbStatus);
  }

  static async addReply(
    id: string,
    reply: string,
    replied_by: string
  ): Promise<Complaint | null> {
    return await ComplaintRepository.addReply(id, reply, replied_by);
  }

  static async deleteComplaint(id: string): Promise<boolean> {
    return await ComplaintRepository.delete(id);
  }
}

export class DashboardService {
  // Get basic stats for all admins
  static async getBasicStats(): Promise<DashboardStats> {
    return await DashboardRepository.getBasicStats();
  }

  // Get full stats including financial data (main admin only)
  static async getFullStats(): Promise<DashboardStats> {
    return await DashboardRepository.getFullStats();
  }

  // Legacy method - redirects to getBasicStats
  static async getDashboardStats(): Promise<DashboardStats> {
    return await DashboardRepository.getBasicStats();
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
    const { query } = await import('@/lib/db');
    const semesterResult = await query(
      'SELECT id FROM semesters WHERE is_active = true LIMIT 1'
    );
    const activeSemester: { id: string } | null = semesterResult.rows[0] || null;

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

export class NewsService {
  static async getAllNews(publishedOnly: boolean = false): Promise<News[]> {
    return await NewsRepository.findAll(publishedOnly);
  }

  static async getNewsById(id: string, publishedOnly: boolean = false): Promise<News | null> {
    return await NewsRepository.findById(id, publishedOnly);
  }

  static async createNews(newsData: Omit<News, 'id' | 'created_at' | 'updated_at'>): Promise<News | null> {
    // Validate required fields
    if (!newsData.title || !newsData.content) {
      throw new Error('Title and content are required');
    }

    return await NewsRepository.create(newsData);
  }

  static async updateNews(id: string, newsData: Partial<News>): Promise<News | null> {
    return await NewsRepository.update(id, newsData);
  }

  static async deleteNews(id: string): Promise<boolean> {
    return await NewsRepository.delete(id);
  }

  static async togglePin(id: string): Promise<News | null> {
    return await NewsRepository.togglePin(id);
  }

  static async togglePublish(id: string): Promise<News | null> {
    return await NewsRepository.togglePublish(id);
  }
}

// Export Parent Mobile Service
export { ParentMobileService } from './ParentMobileService';

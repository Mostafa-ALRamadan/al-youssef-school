import { query } from '@/lib/db';
import { MobileAuthUser } from '@/lib/mobile/auth';

export class ParentMobileService {
  /**
   * 1️⃣ SCHOOL NEWS
   */
  static async getNews() {
    const result = await query(
      `SELECT id, title, content, image_url, video_url, created_at 
       FROM news 
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    return result.rows.map(news => ({
      ...news,
      content_preview: news.content?.substring(0, 200) + (news.content?.length > 200 ? '...' : '')
    }));
  }

  /**
   * 2️⃣ SCHOOL ANNOUNCEMENTS
   */
  static async getAnnouncements() {
    const result = await query(
      `SELECT id, title, content, created_at 
       FROM announcements 
       WHERE audience IN ('all', 'parents')
       ORDER BY created_at DESC 
       LIMIT 20`
    );
    return result.rows;
  }

  /**
   * 3️⃣ MY CHILDREN
   */
  static async getChildren(parentId: string) {
    const result = await query(
      `SELECT 
        s.id,
        s.name,
        s.login_name,
        s.date_of_birth,
        s.gender,
        s.image_url,
        s.created_at,
        c.name as class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.parent_id = $1
       ORDER BY s.name`,
      [parentId]
    );
    return result.rows;
  }

  /**
   * 4️⃣ CHILD DETAILS
   */
  static async getChildDetails(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT 
        s.id,
        s.name,
        s.login_name,
        s.date_of_birth,
        s.gender,
        s.image_url,
        c.name as class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.id = $1`,
      [childId]
    );
    return result.rows[0] || null;
  }

  /**
   * 5️⃣ SUBJECTS FOR CHILD
   */
  static async getChildSubjects(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT DISTINCT
        s.id as subject_id,
        s.name as subject_name
       FROM subjects s
       JOIN teacher_assignments ta ON s.id = ta.subject_id
       JOIN students st ON ta.class_id = st.class_id
       WHERE st.id = $1
       ORDER BY s.name`,
      [childId]
    );
    return result.rows;
  }

  /**
   * 6️⃣ TEACHER POSTS (per subject)
   */
  static async getTeacherPosts(parentId: string, childId: string, subjectId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT 
        tp.id,
        tp.title,
        tp.content,
        tp.image_url,
        tp.video_url,
        t.name as teacher_name,
        tp.created_at
       FROM teacher_posts tp
       JOIN teachers t ON tp.teacher_id = t.id
       JOIN students s ON tp.class_id = s.class_id
       WHERE s.id = $1 AND tp.subject_id = $2
       ORDER BY tp.created_at DESC`,
      [childId, subjectId]
    );
    return result.rows;
  }

  /**
   * 7️⃣ DAILY ATTENDANCE
   */
  static async getChildAttendance(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT 
        ar.status,
        ar.created_at as date
       FROM attendance_records ar
       WHERE ar.student_id = $1
       ORDER BY ar.created_at DESC
       LIMIT 30`,
      [childId]
    );
    return result.rows;
  }

  /**
   * 8️⃣ STUDENT EVALUATIONS
   */
  static async getChildEvaluations(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT 
        t.name as teacher_name,
        s.name as subject_name,
        se.behavior_rating,
        se.participation_rating,
        se.homework_rating,
        se.notes as note,
        se.created_at
       FROM student_evaluations se
       JOIN teachers t ON se.teacher_id = t.id
       LEFT JOIN subjects s ON se.subject_id = s.id
       WHERE se.student_id = $1
       ORDER BY se.created_at DESC`,
      [childId]
    );
    return result.rows;
  }

  /**
   * 9️⃣ WEEKLY SCHEDULE
   */
  static async getChildSchedule(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    const result = await query(
      `SELECT 
        ws.day_of_week,
        ws.start_time,
        ws.end_time,
        s.name as subject_name,
        t.name as teacher_name
       FROM weekly_schedule ws
       JOIN subjects s ON ws.subject_id = s.id
       JOIN teachers t ON ws.teacher_id = t.id
       JOIN students st ON ws.class_id = st.class_id
       WHERE st.id = $1
       ORDER BY ws.day_of_week, ws.start_time`,
      [childId]
    );
    return result.rows;
  }

  /**
   * 🔟 PAYMENTS
   */
  static async getChildPayments(parentId: string, childId: string) {
    // Verify parent owns this child
    const verifyResult = await query(
      'SELECT 1 FROM students WHERE id = $1 AND parent_id = $2',
      [childId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Access denied: Student not found or not your child');
    }

    // Get fee summary
    const feeResult = await query(
      `SELECT 
        COALESCE(SUM(school_fee), 0) as school_fee,
        COALESCE(SUM(transport_fee), 0) as transport_fee,
        COALESCE(SUM(school_fee + transport_fee), 0) as total_fees
       FROM student_fees
       WHERE student_id = $1`,
      [childId]
    );

    // Get payment history
    const paymentsResult = await query(
      `SELECT 
        fp.amount,
        fp.payment_date,
        fp.notes
       FROM fee_payments fp
       JOIN student_fees sf ON fp.student_fee_id = sf.id
       WHERE sf.student_id = $1
       ORDER BY fp.payment_date DESC`,
      [childId]
    );

    const fees = feeResult.rows[0];
    const totalPaid = paymentsResult.rows.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    return {
      school_fee: parseFloat(fees.school_fee),
      transport_fee: parseFloat(fees.transport_fee),
      total_fees: parseFloat(fees.total_fees),
      total_paid: totalPaid,
      remaining: parseFloat(fees.total_fees) - totalPaid,
      payments_history: paymentsResult.rows,
    };
  }

  /**
   * 1️⃣1️⃣ NOTIFICATIONS
   */
  static async getNotifications(parentId: string) {
    const result = await query(
      `SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at
       FROM notifications n
       WHERE n.user_id = $1
       ORDER BY n.created_at DESC
       LIMIT 50`,
      [parentId]
    );
    return result.rows;
  }

  /**
   * 1️⃣2️⃣ MARK NOTIFICATION AS READ
   */
  static async markNotificationRead(parentId: string, notificationId: string) {
    // Verify notification belongs to parent (user_id references parents.id)
    const verifyResult = await query(
      'SELECT 1 FROM notifications WHERE id = $1 AND user_id = $2',
      [notificationId, parentId]
    );
    if (verifyResult.rows.length === 0) {
      throw new Error('Notification not found or access denied');
    }

    await query(
      'UPDATE notifications SET is_read = true, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [notificationId]
    );
    return { success: true };
  }

  /**
   * 1️⃣3️⃣ SEND COMPLAINT/SUGGESTION (Anonymous)
   */
  static async sendComplaint(parentId: string, title: string, message: string, type: string = 'suggestion') {
    // Store in complaints table without exposing parent identity in API response
    const result = await query(
      'INSERT INTO complaints (parent_id, title, message) VALUES ($1, $2, $3) RETURNING id',
      [parentId, title, message]
    );
    return { success: true, id: result.rows[0].id };
  }

  /**
   * 1️⃣4️⃣ REDEEM CODE
   */
  static async redeemCode(parentId: string, code: string) {
    // Verify code and get access info
    const codeResult = await query(
      `SELECT ac.id, ac.class_id, ac.expires_at, ac.is_used
       FROM access_codes ac
       WHERE ac.code = $1`,
      [code]
    );

    if (codeResult.rows.length === 0) {
      throw new Error('Invalid code');
    }

    const accessCode = codeResult.rows[0];

    if (accessCode.is_used) {
      throw new Error('Code has already been used');
    }

    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      throw new Error('Code has expired');
    }

    // Check if any of parent's children are in this class
    const childrenResult = await query(
      'SELECT 1 FROM students WHERE parent_id = $1 AND class_id = $2 LIMIT 1',
      [parentId, accessCode.class_id]
    );

    if (childrenResult.rows.length === 0) {
      throw new Error('This code is not valid for your children');
    }

    // Grant access to premium videos for all children in that class
    const result = await query(
      `INSERT INTO student_video_access (student_id, access_code_id)
       SELECT s.id, $1
       FROM students s
       WHERE s.parent_id = $2 AND s.class_id = $3`,
      [accessCode.id, parentId, accessCode.class_id]
    );

    // Mark code as used
    await query(
      'UPDATE access_codes SET is_used = true WHERE id = $1',
      [accessCode.id]
    );

    return { 
      success: true, 
      message: 'Code redeemed successfully'
    };
  }

  /**
   * 1️⃣5️⃣ PREMIUM VIDEOS
   */
  static async getPremiumVideos(parentId: string) {
    // Get children who have access
    const childrenWithAccess = await query(
      `SELECT DISTINCT s.id, s.class_id
       FROM students s
       JOIN student_video_access sva ON s.id = sva.student_id
       WHERE s.parent_id = $1`,
      [parentId]
    );

    if (childrenWithAccess.rows.length === 0) {
      return { has_access: false, videos: [] };
    }

    const classIds = childrenWithAccess.rows.map(c => c.class_id);

    const videosResult = await query(
      `SELECT 
        pv.id,
        pv.title,
        pv.description,
        pv.youtube_url
       FROM premium_videos pv
       WHERE pv.class_id = ANY($1)
       ORDER BY pv.created_at DESC`,
      [classIds]
    );

    return {
      has_access: true,
      videos: videosResult.rows,
    };
  }

  /**
   * 1️⃣6️⃣ STARS OF THE YEAR
   */
  static async getStarsOfTheYear() {
    const result = await query(
      `SELECT 
        c.name as class_name,
        s.name as student_name,
        s.image_url,
        cts.position,
        ay.name as academic_year,
        COALESCE(g.total_grades, 0) as total_grades
       FROM class_top_students cts
       JOIN students s ON cts.student_id = s.id
       JOIN classes c ON cts.class_id = c.id
       JOIN academic_years ay ON cts.academic_year_id = ay.id
       LEFT JOIN (
         SELECT 
           g.student_id,
           SUM(g.score) as total_grades
         FROM grades g
         JOIN semesters sem ON g.semester_id = sem.id
         WHERE sem.is_active = true
         GROUP BY g.student_id
       ) g ON cts.student_id = g.student_id
       ORDER BY c.name, cts.position`
    );

    // Group by class
    const grouped = result.rows.reduce((acc, row) => {
      if (!acc[row.class_name]) {
        acc[row.class_name] = [];
      }
      acc[row.class_name].push({
        student_name: row.student_name,
        image_url: row.image_url,
        position: row.position,
        academic_year: row.academic_year,
        total_grades: row.total_grades,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return Object.entries(grouped).map(([class_name, students]) => ({
      class_name,
      students,
    }));
  }

  /**
   * 1️⃣7️⃣ ABOUT VIDEO
   */
  static async getSettings() {
    const result = await query(
      `SELECT about_video_url FROM app_settings LIMIT 1`
    );
    return result.rows[0] || { about_video_url: null };
  }
}

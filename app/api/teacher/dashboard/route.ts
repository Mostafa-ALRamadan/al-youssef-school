import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/teacher/dashboard
// Returns dashboard statistics for the logged-in teacher
export async function GET(request: NextRequest) {
  try {
    // Get token from Authorization header
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token
    const decoded = verifyToken(token);

    if (!decoded) {
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Check if user is teacher
    if (decoded.role !== 'teacher') {
      return NextResponse.json(
        { error: 'Forbidden - Teacher access required' },
        { status: 403 }
      );
    }

    const userId = decoded.userId;

    // Get the teacher.id from teachers table using user_id
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [userId]
    );

    if (teacherResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const teacherId = teacherResult.rows[0].id;

    // Get teacher's assignments (classes and subjects)
    const assignmentsResult = await query(`
      SELECT
        COUNT(DISTINCT class_id) as class_count,
        COUNT(DISTINCT subject_id) as subject_count
      FROM teacher_assignments
      WHERE teacher_id = $1
    `, [teacherId]);

    // Get distinct students taught by this teacher
    const studentsResult = await query(`
      SELECT COUNT(DISTINCT s.id) as student_count
      FROM students s
      INNER JOIN teacher_assignments ta ON s.class_id = ta.class_id
      WHERE ta.teacher_id = $1
    `, [teacherId]);

    // Get today's attendance sessions for this teacher
    const today = new Date().toISOString().split('T')[0];
    const attendanceSessionsResult = await query(`
      SELECT COUNT(*) as session_count
      FROM attendance_sessions a_ses
      INNER JOIN weekly_schedule ws ON a_ses.schedule_id = ws.id
      WHERE ws.teacher_id = $1 AND a_ses.date = $2
    `, [teacherId, today]);

    // Get attendance records count for today's sessions
    const attendanceRecordsResult = await query(`
      SELECT COUNT(*) as record_count
      FROM attendance_records ar
      INNER JOIN attendance_sessions a_ses ON ar.session_id = a_ses.id
      INNER JOIN weekly_schedule ws ON a_ses.schedule_id = ws.id
      WHERE ws.teacher_id = $1 AND a_ses.date = $2
    `, [teacherId, today]);

    // Get latest post by this teacher
    const latestPostResult = await query(`
      SELECT *
      FROM teacher_posts
      WHERE teacher_id = $1
      ORDER BY created_at DESC
      LIMIT 1
    `, [teacherId]);

    // Get latest attendance session for this teacher
    const latestAttendanceResult = await query(`
      SELECT a_ses.*, c.name as class_name, s.name as subject_name
      FROM attendance_sessions a_ses
      INNER JOIN weekly_schedule ws ON a_ses.schedule_id = ws.id
      LEFT JOIN classes c ON ws.class_id = c.id
      LEFT JOIN subjects s ON ws.subject_id = s.id
      WHERE ws.teacher_id = $1
      ORDER BY a_ses.created_at DESC
      LIMIT 1
    `, [teacherId]);

    // Get latest evaluation by this teacher
    const latestEvaluationResult = await query(`
      SELECT se.*, s.name as student_name, c.name as class_name
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      WHERE se.teacher_id = $1
      ORDER BY se.created_at DESC
      LIMIT 1
    `, [teacherId]);

    return NextResponse.json({
      totalStudents: parseInt(studentsResult.rows[0]?.student_count || 0),
      totalClasses: parseInt(assignmentsResult.rows[0]?.class_count || 0),
      totalSubjects: parseInt(assignmentsResult.rows[0]?.subject_count || 0),
      todayAttendance: parseInt(attendanceRecordsResult.rows[0]?.record_count || 0),
      todaySessions: parseInt(attendanceSessionsResult.rows[0]?.session_count || 0),
      latestPost: latestPostResult.rows[0] || null,
      latestAttendance: latestAttendanceResult.rows[0] || null,
      latestEvaluation: latestEvaluationResult.rows[0] || null,
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

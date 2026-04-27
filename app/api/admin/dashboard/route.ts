import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/dashboard
// Returns dashboard statistics based on admin role
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

    // Check if user is admin
    if (decoded.role !== 'admin') {
      return NextResponse.json(
        { error: 'Forbidden - Admin access required' },
        { status: 403 }
      );
    }

    const isMainAdmin = (decoded as any).isMainAdmin || (decoded as any).is_main_admin || false;

    // Get basic stats (all admins)
    const [studentsResult, teachersResult, classesResult, complaintsResult] = await Promise.all([
      query('SELECT COUNT(*) as count FROM students'),
      query('SELECT COUNT(*) as count FROM teachers'),
      query('SELECT COUNT(*) as count FROM classes'),
      query(`SELECT COUNT(*) as count FROM complaints WHERE status = 'pending'`),
    ]);

    // Get today's attendance stats
    const today = new Date().toISOString().split('T')[0];
    const attendanceSessionsResult = await query(
      'SELECT id FROM attendance_sessions WHERE date = $1',
      [today]
    );

    let todayPresent = 0;
    let todayAbsent = 0;

    if (attendanceSessionsResult.rows.length > 0) {
      const sessionIds = attendanceSessionsResult.rows.map((s: any) => s.id);
      const attendanceRecordsResult = await query(
        'SELECT status FROM attendance_records WHERE session_id = ANY($1)',
        [sessionIds]
      );

      const records = attendanceRecordsResult.rows;
      todayPresent = records.filter((r: any) => r.status === 'present').length;
      todayAbsent = records.filter((r: any) => r.status === 'absent').length;
    }

    // Prepare response with basic stats
    const response: any = {
      totalStudents: parseInt(studentsResult.rows[0].count),
      totalTeachers: parseInt(teachersResult.rows[0].count),
      totalClasses: parseInt(classesResult.rows[0].count),
      todayPresent,
      todayAbsent,
      newComplaints: parseInt(complaintsResult.rows[0].count),
    };

    // Add financial stats for main admin only
    if (isMainAdmin) {
      const [feesResult, paymentsResult] = await Promise.all([
        query('SELECT COALESCE(SUM(school_fee + transport_fee), 0) as total FROM student_fees'),
        query('SELECT COALESCE(SUM(amount), 0) as total FROM fee_payments'),
      ]);

      const totalFees = parseFloat(feesResult.rows[0].total);
      const totalPaid = parseFloat(paymentsResult.rows[0].total);

      response.totalFees = totalFees;
      response.totalPaid = totalPaid;
      response.totalRemaining = totalFees - totalPaid;
    }

    // Get recent activities (optional - last 1 of each)
    const [latestAnnouncement, latestPayment, latestAttendanceSession] = await Promise.all([
      query('SELECT * FROM announcements ORDER BY created_at DESC LIMIT 1'),
      query(`
        SELECT fp.*, s.name as student_name
        FROM fee_payments fp
        LEFT JOIN student_fees sf ON fp.student_fee_id = sf.id
        LEFT JOIN students s ON sf.student_id = s.id
        ORDER BY fp.created_at DESC
        LIMIT 1
      `),
      query('SELECT * FROM attendance_sessions ORDER BY created_at DESC LIMIT 1'),
    ]);

    if (latestAnnouncement.rows.length > 0) {
      response.latestAnnouncement = latestAnnouncement.rows[0];
    }
    if (latestPayment.rows.length > 0) {
      response.latestPayment = latestPayment.rows[0];
    }
    if (latestAttendanceSession.rows.length > 0) {
      response.latestAttendanceSession = latestAttendanceSession.rows[0];
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard statistics' },
      { status: 500 }
    );
  }
}

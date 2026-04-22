import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService, ClassService } from '@/services';
import { query } from '@/lib/db';

/**
 * GET /api/admin/attendance?class_id=&date=&semester_id=
 * Returns attendance for a class on a specific date
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const date = searchParams.get('date');
    const semesterId = searchParams.get('semester_id');

    if (!classId || !date) {
      return NextResponse.json(
        { error: 'class_id and date are required' },
        { status: 400 }
      );
    }

    // Get class attendance
    const attendanceData = await AttendanceService.getClassAttendance(classId, date);

    // Filter by semester if provided - only show lessons with attendance records in that semester
    if (semesterId && attendanceData.lessons) {
      // Get session IDs for this date
      const scheduleIds = attendanceData.lessons.map((l: any) => l.schedule_id).filter(Boolean);

      if (scheduleIds.length > 0) {
        const schedulePlaceholders = scheduleIds.map((_: any, i: number) => `$${i + 1}`).join(',');
        
        // Find sessions for these schedules on this date
        const sessionsResult = await query(
          `SELECT id, schedule_id FROM attendance_sessions 
           WHERE schedule_id IN (${schedulePlaceholders}) AND date = $${scheduleIds.length + 1}`,
          [...scheduleIds, date]
        );
        const sessions = sessionsResult.rows;
        const sessionIds = sessions?.map((s: any) => s.id) || [];

        if (sessionIds.length > 0) {
          const sessionPlaceholders = sessionIds.map((_: any, i: number) => `$${i + 2}`).join(',');
          
          // Check which sessions have records in this semester
          const recordsResult = await query(
            `SELECT session_id FROM attendance_records 
             WHERE session_id IN (${sessionPlaceholders}) AND semester_id = $1`,
            [semesterId, ...sessionIds]
          );
          const records = recordsResult.rows;
          const sessionsWithSemester = new Set(records?.map((r: any) => r.session_id) || []);

          // Filter lessons to only those with attendance in this semester
          attendanceData.lessons = attendanceData.lessons.filter((lesson: any) => {
            const session = sessions?.find((s: any) => s.schedule_id === lesson.schedule_id);
            return session && sessionsWithSemester.has(session.id);
          });
        } else {
          attendanceData.lessons = [];
        }
      }
    }

    // Get class details
    const classDetails = await ClassService.getClassById(classId);

    return NextResponse.json({
      ...attendanceData,
      class: classDetails,
    });
  } catch (error: any) {
    console.error('Admin attendance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}

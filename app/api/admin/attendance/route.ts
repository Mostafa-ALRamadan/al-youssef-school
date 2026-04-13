import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService, ClassService } from '@/services';
import { createServerSupabaseClient } from '@/lib/supabase-server';

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
      const supabase = createServerSupabaseClient();

      // Get session IDs for this date
      const scheduleIds = attendanceData.lessons.map((l: any) => l.schedule_id).filter(Boolean);

      if (scheduleIds.length > 0) {
        // Find sessions for these schedules on this date
        const { data: sessions } = await supabase
          .from('attendance_sessions')
          .select('id, schedule_id')
          .in('schedule_id', scheduleIds)
          .eq('date', date);

        const sessionIds = sessions?.map(s => s.id) || [];

        if (sessionIds.length > 0) {
          // Check which sessions have records in this semester
          const { data: records } = await supabase
            .from('attendance_records')
            .select('session_id')
            .in('session_id', sessionIds)
            .eq('semester_id', semesterId);

          const sessionsWithSemester = new Set(records?.map(r => r.session_id) || []);

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

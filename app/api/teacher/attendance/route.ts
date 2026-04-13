import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services';
import { supabase } from '@/lib/supabase-server';

/**
 * GET /api/teacher/attendance
 * Returns today's lessons for the logged-in teacher with attendance status
 */
export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get teacher profile for current user
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get today's date (local timezone)
    const todayDate = new Date();
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    const today = `${year}-${month}-${day}`;

    // Get today's lessons with attendance status
    const lessons = await AttendanceService.getTeacherTodayLessons(teacher.id, today);

    return NextResponse.json({ lessons });
  } catch (error: any) {
    console.error('Teacher attendance API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch attendance data' },
      { status: 500 }
    );
  }
}

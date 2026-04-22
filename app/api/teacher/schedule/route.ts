import { NextRequest, NextResponse } from 'next/server';
import { WeeklyScheduleService } from '@/services';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

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

    // Verify token and get user
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get teacher profile for current user
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [user.userId]
    );
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    const schedules = await WeeklyScheduleService.getSchedulesByTeacherId(teacher.id);

    return NextResponse.json({ schedules });
  } catch (error: any) {
    console.error('Teacher schedule API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schedule' },
      { status: 500 }
    );
  }
}

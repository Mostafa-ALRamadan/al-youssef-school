import { NextRequest, NextResponse } from 'next/server';
import { AttendanceService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/attendance/students?schedule_id=&date=
 * Returns students for attendance marking with existing records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const scheduleId = searchParams.get('schedule_id');
    const date = searchParams.get('date');

    if (!scheduleId || !date) {
      return NextResponse.json(
        { error: 'schedule_id and date are required' },
        { status: 400 }
      );
    }

    const data = await AttendanceService.getStudentsForAttendance(scheduleId, date);

    return NextResponse.json(data);
  } catch (error) {
    console.error('Get attendance students error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

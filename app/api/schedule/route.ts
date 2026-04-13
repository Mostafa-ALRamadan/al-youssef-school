import { NextRequest, NextResponse } from 'next/server';
import { ScheduleService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/schedule
 * Returns weekly schedule for a class
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    if (!classId) {
      return NextResponse.json(
        { error: 'معرف الصف مطلوب' },
        { status: 400 }
      );
    }

    const schedule = await ScheduleService.getClassSchedule(classId);
    return NextResponse.json({ schedule });
  } catch (error) {
    console.error('Get schedule error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

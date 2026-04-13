import { NextRequest, NextResponse } from 'next/server';
import { TimeSlotService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/time-slots
 * Returns all time slots ordered by start_time
 */
export async function GET() {
  try {
    const timeSlots = await TimeSlotService.getAllTimeSlots();
    return NextResponse.json({ timeSlots });
  } catch (error) {
    console.error('Get time slots error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/time-slots
 * Creates a new time slot
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { start_time, end_time } = body;

    // Validation
    if (!start_time || !end_time) {
      return NextResponse.json(
        { error: 'وقت البداية ووقت النهاية مطلوبان' },
        { status: 400 }
      );
    }

    const timeSlot = await TimeSlotService.createTimeSlot({
      start_time,
      end_time,
    });

    if (!timeSlot) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الفترة الزمنية' },
        { status: 500 }
      );
    }

    return NextResponse.json({ timeSlot }, { status: 201 });
  } catch (error: any) {
    console.error('Create time slot error:', error);
    return NextResponse.json(
      { error: error.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

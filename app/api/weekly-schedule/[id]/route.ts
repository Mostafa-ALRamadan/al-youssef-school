import { NextRequest, NextResponse } from 'next/server';
import { WeeklyScheduleService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * DELETE /api/weekly-schedule/[id]
 * Deletes a weekly schedule entry
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await WeeklyScheduleService.deleteSchedule(id);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف البرنامج الأسبوعي' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error('Delete weekly schedule error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

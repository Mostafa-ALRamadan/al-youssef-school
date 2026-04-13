import { NextRequest, NextResponse } from 'next/server';
import { TimeSlotService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * DELETE /api/time-slots/[id]
 * Deletes a time slot
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const success = await TimeSlotService.deleteTimeSlot(id);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف الفترة الزمنية' },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: 'تم الحذف بنجاح' });
  } catch (error) {
    console.error('Delete time slot error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

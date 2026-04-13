import { NextRequest, NextResponse } from 'next/server';
import { TeacherAssignmentService } from '@/services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

/**
 * DELETE /api/teacher-assignments/{id}
 * Deletes a teacher assignment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف التعيين مطلوب' },
        { status: 400 }
      );
    }

    const success = await TeacherAssignmentService.deleteAssignment(id);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف التعيين' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.DELETED,
    });
  } catch (error) {
    console.error('Delete assignment error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

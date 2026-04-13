import { NextRequest, NextResponse } from 'next/server';
import { TeacherAssignmentService } from '@/services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/teacher-assignments
 * Returns all teacher assignments with joined data
 */
export async function GET() {
  try {
    const assignments = await TeacherAssignmentService.getAllAssignments();
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher-assignments
 * Creates a new teacher assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacher_id, subject_id, class_id } = body;

    if (!teacher_id || !subject_id || !class_id) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const assignment = await TeacherAssignmentService.createAssignment({
      teacher_id,
      subject_id,
      class_id,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'التعيين موجود مسبقاً أو حدث خطأ' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.CREATED, assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create assignment error:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'هذا التعيين موجود مسبقاً' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

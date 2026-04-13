import { NextRequest, NextResponse } from 'next/server';
import { GradeService } from '@/services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/grades
 * Returns grades for a student
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب' },
        { status: 400 }
      );
    }

    const grades = await GradeService.getStudentGrades(studentId);
    return NextResponse.json({ grades });
  } catch (error) {
    console.error('Get grades error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/grades
 * Records a new grade
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const grade = await GradeService.recordGrade(body);

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.CREATED, grade },
      { status: 201 }
    );
  } catch (error) {
    console.error('Record grade error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

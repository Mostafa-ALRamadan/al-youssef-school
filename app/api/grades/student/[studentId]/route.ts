import { NextRequest, NextResponse } from 'next/server';
import { GradeService } from '@/services';

// GET /api/grades/student/[studentId] - Get student's grade history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    const { studentId } = await params;

    const grades = await GradeService.getStudentGradeHistory(studentId);

    return NextResponse.json({ grades });
  } catch (error) {
    console.error('GET /api/grades/student/[studentId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

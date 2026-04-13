import { NextRequest, NextResponse } from 'next/server';
import { ExamService, GradeService } from '@/services';
import { supabase } from '@/lib/supabase-server';

// GET /api/teacher/grades/[examId] - Get exam details with grades
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;

    const exam = await ExamService.getExamById(examId);

    if (!exam) {
      return NextResponse.json(
        { error: 'الامتحان غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ exam });
  } catch (error) {
    console.error('GET /api/teacher/grades/[examId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/teacher/grades/[examId] - Save grades for an exam
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;
    const { grades } = await request.json();

    if (!grades || !Array.isArray(grades)) {
      return NextResponse.json(
        { error: 'الدرجات غير صالحة' },
        { status: 400 }
      );
    }

    // Validate all grades have required fields
    for (const grade of grades) {
      if (!grade.student_id || grade.score === undefined) {
        return NextResponse.json(
          { error: 'جميع الحقول مطلوبة لكل درجة' },
          { status: 400 }
        );
      }
    }

    const results = await GradeService.saveGrades(examId, grades);

    return NextResponse.json({ success: true, results });
  } catch (error: any) {
    console.error('POST /api/teacher/grades/[examId] error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل في حفظ الدرجات' },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/grades/[examId] - Delete an exam
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ examId: string }> }
) {
  try {
    const { examId } = await params;

    const success = await ExamService.deleteExam(examId);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف الامتحان' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/teacher/grades/[examId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { ExamService, GradeService } from '@/services';
import { query } from '@/lib/db';

// GET /api/admin/grades/[examId] - Get exam details with all grades
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

    // Get all grades for this exam with student and semester info using JOINs
    const gradesResult = await query(
      `SELECT g.*, s.name as student_name, sem.name as semester_name, ay.name as academic_year_name
       FROM grades g
       LEFT JOIN students s ON g.student_id = s.id
       LEFT JOIN semesters sem ON g.semester_id = sem.id
       LEFT JOIN academic_years ay ON sem.academic_year_id = ay.id
       WHERE g.exam_id = $1`,
      [examId]
    );
    
    const transformedGrades = gradesResult.rows || [];

    return NextResponse.json({ exam: { ...exam, grades: transformedGrades } });
  } catch (error) {
    console.error('GET /api/admin/grades/[examId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/grades/[examId] - Delete an exam (admin only)
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
    console.error('DELETE /api/admin/grades/[examId] error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

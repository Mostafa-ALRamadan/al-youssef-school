import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * POST /api/stars-of-the-year/calculate
 * Calculates top students by total grades for a class and academic year
 * Body: { class_id, academic_year_id }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { class_id, academic_year_id } = body;

    if (!class_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'معرف الصف والسنة الدراسية مطلوبان' },
        { status: 400 }
      );
    }

    // Get all semesters for this academic year
    const semestersResult = await query(
      'SELECT id FROM semesters WHERE academic_year_id = $1',
      [academic_year_id]
    );
    const semesters = semestersResult.rows;

    if (!semesters || semesters.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد فصول دراسية لهذه السنة' },
        { status: 400 }
      );
    }

    const semesterIds = semesters.map((s: any) => s.id);

    // Get all exams for this class
    const examsResult = await query(
      'SELECT id FROM exams WHERE class_id = $1',
      [class_id]
    );
    const exams = examsResult.rows;

    if (!exams || exams.length === 0) {
      return NextResponse.json(
        { students: [], message: 'لا توجد امتحانات لهذا الصف' },
        { status: 200 }
      );
    }

    const examIds = exams.map((e: any) => e.id);

    // Get all grades for these exams and semesters with student names
    const placeholders1 = examIds.map((_: any, i: number) => `$${i + 1}`).join(',');
    const placeholders2 = semesterIds.map((_: any, i: number) => `$${examIds.length + i + 1}`).join(',');
    
    const gradesResult = await query(
      `SELECT g.student_id, g.score, s.name as student_name, s.image_url
       FROM grades g
       JOIN students s ON g.student_id = s.id
       WHERE g.exam_id IN (${placeholders1})
       AND g.semester_id IN (${placeholders2})`,
      [...examIds, ...semesterIds]
    );
    const grades = gradesResult.rows;

    // Calculate total scores per student
    const studentScores: Record<string, { id: string; name: string; total: number; image_url?: string }> = {};

    grades?.forEach((grade: any) => {
      const studentId = grade.student_id;
      if (!studentScores[studentId]) {
        studentScores[studentId] = {
          id: studentId,
          name: grade.student_name || '',
          total: 0,
          image_url: grade.image_url,
        };
      }
      studentScores[studentId].total += Number(grade.score) || 0;
    });

    // Convert to array and sort by total score descending
    const sortedStudents = Object.values(studentScores)
      .sort((a, b) => b.total - a.total);

    return NextResponse.json({
      students: sortedStudents,
    });
  } catch (error) {
    console.error('Error in calculate stars:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

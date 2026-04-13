import { NextRequest, NextResponse } from 'next/server';
import { ExamService, GradeService } from '@/services';
import { supabase } from '@/lib/supabase-server';

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

    // Get all grades for this exam with semester info
    const { data: grades } = await supabase
      .from('grades')
      .select(`
        *,
        students(name),
        semesters(name, academic_years(name))
      `)
      .eq('exam_id', examId);

    // Batch fetch semesters for better performance
    const semesterIds = [...new Set(grades?.map(g => g.semester_id).filter(Boolean))];
    let semestersMap = new Map();
    
    if (semesterIds.length > 0) {
      const { data: semesters } = await supabase
        .from('semesters')
        .select('id, name, academic_years(name)')
        .in('id', semesterIds);
      
      // Create a map for quick lookup
      semesters?.forEach((s: any) => {
        semestersMap.set(s.id, s);
      });
    }
    
    // Transform grades with batch-fetched semester info
    const transformedGrades = grades?.map((g: any) => {
      const semester = semestersMap.get(g.semester_id);
      
      return {
        ...g,
        student_name: g.students?.name,
        semester_name: g.semesters?.name || semester?.name || '-',
        academic_year_name: g.semesters?.academic_years?.name || (semester as any)?.academic_years?.name || '-',
      };
    }) || [];

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

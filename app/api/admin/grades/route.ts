import { NextRequest, NextResponse } from 'next/server';
import { ExamService } from '@/services';
import { supabase } from '@/lib/supabase-server';

// GET /api/admin/grades - Get all exams with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const semesterId = searchParams.get('semester_id');

    let exams = await ExamService.getAllExams();

    // Apply filters if provided
    if (classId) {
      exams = exams.filter(e => e.class_id === classId);
    }
    if (subjectId) {
      exams = exams.filter(e => e.subject_id === subjectId);
    }

    // Filter by semester - only show exams that have grades in that semester
    if (semesterId) {
      // Get exam IDs that have grades in this semester
      const { data: grades } = await supabase
        .from('grades')
        .select('exam_id')
        .eq('semester_id', semesterId);

      const examIdsWithGrades = new Set(grades?.map(g => g.exam_id) || []);
      exams = exams.filter(e => examIdsWithGrades.has(e.id));
    }

    // Get semester info for each exam from its grades
    const examIds = exams.map(e => e.id);
    if (examIds.length > 0) {
      const { data: gradesWithSemester } = await supabase
        .from('grades')
        .select('exam_id, semesters(name, academic_years(name))')
        .in('exam_id', examIds)
        .limit(1);
      
      // Create a map of exam_id to semester info
      const semesterMap = new Map();
      gradesWithSemester?.forEach((g: any) => {
        if (!semesterMap.has(g.exam_id)) {
          semesterMap.set(g.exam_id, {
            semester_name: g.semesters?.name,
            academic_year_name: g.semesters?.academic_years?.name
          });
        }
      });

      // Add semester info to exams
      exams = exams.map(e => ({
        ...e,
        semester_name: semesterMap.get(e.id)?.semester_name || '-'
      }));
    }

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('GET /api/admin/grades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

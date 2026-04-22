import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/admin/grades - Get all exams with optional filters
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const subjectId = searchParams.get('subject_id');
    const semesterId = searchParams.get('semester_id');

    // Get all exams with class/subject/teacher names
    let examsQuery = `
      SELECT e.*, 
        c.name as class_name,
        s.name as subject_name,
        t.name as teacher_name
      FROM exams e
      LEFT JOIN classes c ON e.class_id = c.id
      LEFT JOIN subjects s ON e.subject_id = s.id
      LEFT JOIN teachers t ON e.teacher_id = t.id
      ORDER BY e.created_at DESC
    `;
    let examsResult = await query(examsQuery);
    let exams = examsResult.rows || [];

    // Apply filters if provided
    if (classId) {
      exams = exams.filter(e => e.class_id === classId);
    }
    if (subjectId) {
      exams = exams.filter(e => e.subject_id === subjectId);
    }

    // Filter by semester - only show exams that have grades in that semester
    if (semesterId) {
      const gradesResult = await query(
        'SELECT DISTINCT exam_id FROM grades WHERE semester_id = $1',
        [semesterId]
      );
      const examIdsWithGrades = new Set(gradesResult.rows?.map(g => g.exam_id) || []);
      exams = exams.filter(e => examIdsWithGrades.has(e.id));
    }

    // Get semester info for each exam from its grades
    const examIds = exams.map(e => e.id);
    if (examIds.length > 0) {
      const examPlaceholders = examIds.map((_, i) => `$${i + 1}`).join(',');
      const gradesResult = await query(
        `SELECT DISTINCT g.exam_id, s.name as semester_name, ay.name as academic_year_name 
         FROM grades g
         JOIN semesters s ON g.semester_id = s.id
         JOIN academic_years ay ON s.academic_year_id = ay.id
         WHERE g.exam_id IN (${examPlaceholders})`,
        examIds
      );
      
      // Create a map of exam_id to semester info
      const semesterMap = new Map();
      gradesResult.rows?.forEach((g: any) => {
        if (!semesterMap.has(g.exam_id)) {
          semesterMap.set(g.exam_id, {
            semester_name: g.semester_name,
            academic_year_name: g.academic_year_name
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

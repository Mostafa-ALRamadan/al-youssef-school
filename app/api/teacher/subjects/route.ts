import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/teacher/subjects
 * Get subjects assigned to the current teacher
 */
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID
    const teacherResult = await query('SELECT id FROM teachers WHERE user_id = $1', [user.userId]);
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get distinct subjects assigned to this teacher through teacher_assignments
    const subjectsResult = await query(
      `SELECT DISTINCT s.id, s.name
       FROM subjects s
       INNER JOIN teacher_assignments ta ON s.id = ta.subject_id
       WHERE ta.teacher_id = $1
       ORDER BY s.name`,
      [teacher.id]
    );

    return NextResponse.json({ subjects: subjectsResult.rows });
  } catch (error) {
    console.error('GET /api/teacher/subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

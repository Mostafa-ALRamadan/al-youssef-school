import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/teacher/classes/{classId}/subjects
 * Get subjects assigned to the current teacher for a specific class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ classId: string }> }
) {
  try {
    const { classId } = await params;
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID from user
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [user.userId]
    );

    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const teacherId = teacherResult.rows[0].id;

    // Get subjects assigned to this teacher for this specific class
    const subjectsResult = await query(
      `SELECT DISTINCT s.id, s.name
       FROM subjects s
       INNER JOIN teacher_assignments ta ON s.id = ta.subject_id
       WHERE ta.teacher_id = $1 AND ta.class_id = $2
       ORDER BY s.name`,
      [teacherId, classId]
    );

    return NextResponse.json({ subjects: subjectsResult.rows });
  } catch (error) {
    console.error('GET /api/teacher/classes/{classId}/subjects error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

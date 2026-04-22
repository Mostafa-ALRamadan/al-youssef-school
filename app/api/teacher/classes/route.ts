import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/teacher/classes
 * Get classes assigned to the current teacher
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

    // Get distinct classes assigned to this teacher
    const classesResult = await query(
      `SELECT DISTINCT c.id, c.name
       FROM classes c
       INNER JOIN teacher_assignments ta ON c.id = ta.class_id
       WHERE ta.teacher_id = $1
       ORDER BY c.name`,
      [teacher.id]
    );

    return NextResponse.json({ classes: classesResult.rows });
  } catch (error) {
    console.error('GET /api/teacher/classes error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

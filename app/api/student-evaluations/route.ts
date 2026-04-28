import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/student-evaluations - Get all evaluations or filter by student/class/teacher/semester
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const teacherId = searchParams.get('teacher_id');
    const semesterId = searchParams.get('semester_id');

    const subjectId = searchParams.get('subject_id');

    // Build dynamic query with JOINs
    let sql = `
      SELECT se.*, s.name as student_name, s.class_id, c.name as class_name, 
             t.name as teacher_name, sub.name as subject_name
      FROM student_evaluations se
      LEFT JOIN students s ON se.student_id = s.id
      LEFT JOIN classes c ON s.class_id = c.id
      LEFT JOIN teachers t ON se.teacher_id = t.id
      LEFT JOIN subjects sub ON se.subject_id = sub.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (studentId) {
      params.push(studentId);
      sql += ` AND se.student_id = $${params.length}`;
    }

    if (teacherId) {
      params.push(teacherId);
      sql += ` AND se.teacher_id = $${params.length}`;
    }

    if (classId) {
      params.push(classId);
      sql += ` AND s.class_id = $${params.length}`;
    }

    if (semesterId) {
      params.push(semesterId);
      sql += ` AND se.semester_id = $${params.length}`;
    }

    if (subjectId) {
      params.push(subjectId);
      sql += ` AND se.subject_id = $${params.length}`;
    }

    sql += ' ORDER BY se.created_at DESC';

    const result = await query(sql, params);

    return NextResponse.json({ evaluations: result.rows });
  } catch (error: any) {
    console.error('GET evaluations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/student-evaluations - Create new evaluation
export async function POST(request: NextRequest) {
  try {
    const { getCurrentUser } = await import('@/lib/auth');
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID from user
    const teacherResult = await query('SELECT id FROM teachers WHERE user_id = $1', [user.userId]);
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await request.json();
    const { student_id, subject_id, behavior_rating, participation_rating, homework_rating, notes } = body;

    // Validate required fields
    if (!student_id) {
      return NextResponse.json(
        { error: 'student_id is required' },
        { status: 400 }
      );
    }

    if (!subject_id) {
      return NextResponse.json(
        { error: 'subject_id is required' },
        { status: 400 }
      );
    }

    // Validate ratings are between 1 and 5
    const ratings = [behavior_rating, participation_rating, homework_rating].filter(r => r !== undefined && r !== null);
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    // Get active semester
    const semesterResult = await query(
      'SELECT id FROM semesters WHERE is_active = true LIMIT 1'
    );
    const activeSemester = semesterResult.rows[0];

    const result = await query(
      `INSERT INTO student_evaluations (student_id, teacher_id, subject_id, behavior_rating, participation_rating, homework_rating, notes, semester_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [student_id, teacher.id, subject_id, behavior_rating, participation_rating, homework_rating, notes, activeSemester?.id]
    );

    return NextResponse.json({ evaluation: result.rows[0] }, { status: 201 });
  } catch (error: any) {
    console.error('POST evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/student-evaluations - Update evaluation
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, subject_id, behavior_rating, participation_rating, homework_rating, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Validate ratings are between 1 and 5
    const ratings = [behavior_rating, participation_rating, homework_rating].filter(r => r !== undefined && r !== null);
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    const result = await query(
      `UPDATE student_evaluations
       SET subject_id = $1, behavior_rating = $2, participation_rating = $3, homework_rating = $4, notes = $5
       WHERE id = $6
       RETURNING *`,
      [subject_id || null, behavior_rating, participation_rating, homework_rating, notes, id]
    );

    return NextResponse.json({ evaluation: result.rows[0] });
  } catch (error: any) {
    console.error('PUT evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/student-evaluations?id=xxx - Delete evaluation
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    await query('DELETE FROM student_evaluations WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

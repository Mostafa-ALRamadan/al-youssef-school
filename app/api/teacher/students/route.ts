import { NextRequest, NextResponse } from 'next/server';
import { TeacherStudentService } from '@/services';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    if (!token) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      );
    }

    // Verify token and get user
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // Get teacher profile for current user
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [user.userId]
    );
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json(
        { error: 'Teacher profile not found' },
        { status: 404 }
      );
    }

    // Get class_id from query params
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    let students;
    if (classId) {
      // Get students for specific class
      const studentsResult = await query(
        'SELECT id, name, class_id FROM students WHERE class_id = $1 ORDER BY name',
        [classId]
      );
      students = studentsResult.rows;
    } else {
      // Get all students for teacher
      const result = await TeacherStudentService.getStudentsForTeacher(teacher.id);
      students = result.students || [];
    }

    // Get teacher's classes for the dropdown
    const classesResult = await query(`
      SELECT DISTINCT c.id, c.name
      FROM classes c
      JOIN teacher_assignments ta ON c.id = ta.class_id
      WHERE ta.teacher_id = $1
      ORDER BY c.name
    `, [teacher.id]);

    return NextResponse.json({ students, classes: classesResult.rows });
  } catch (error: any) {
    console.error('Teacher students API error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch students' },
      { status: 500 }
    );
  }
}

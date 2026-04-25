import { NextRequest, NextResponse } from 'next/server';
import { TeacherAssignmentService } from '@/services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';
import { query } from '@/lib/db';

/**
 * GET /api/teacher-assignments
 * Returns current teacher's assignments with joined data
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const cookieStore = await cookies();
    let token = cookieStore.get('auth_token')?.value;
    
    // If no cookie, check Authorization header
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (decoded?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can access this' }, { status: 403 });
    }
    
    // Get teacher_id from user_id
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    const teacherId = teacherResult.rows[0].id;
    
    // Get teacher's assignments with class and subject names
    const assignments = await query(
      `SELECT 
        ta.id,
        ta.class_id,
        c.name as class_name,
        ta.subject_id,
        s.name as subject_name
       FROM teacher_assignments ta
       JOIN classes c ON ta.class_id = c.id
       JOIN subjects s ON ta.subject_id = s.id
       WHERE ta.teacher_id = $1`,
      [teacherId]
    );
    
    return NextResponse.json({ assignments: assignments.rows });
  } catch (error) {
    console.error('Get assignments error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teacher-assignments
 * Creates a new teacher assignment
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { teacher_id, subject_id, class_id } = body;

    if (!teacher_id || !subject_id || !class_id) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const assignment = await TeacherAssignmentService.createAssignment({
      teacher_id,
      subject_id,
      class_id,
    });

    if (!assignment) {
      return NextResponse.json(
        { error: 'التعيين موجود مسبقاً أو حدث خطأ' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.CREATED, assignment },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create assignment error:', error);
    
    if (error.code === '23505') {
      return NextResponse.json(
        { error: 'هذا التعيين موجود مسبقاً' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

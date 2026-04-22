import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

/**
 * GET /api/teachers
 * Returns all teachers with their assigned subject and class info
 */
export async function GET(request: NextRequest) {
  try {
    // Join with users to get email and subjects to get subject name
    const result = await query(`
      SELECT 
        t.id, 
        t.name, 
        t.phone, 
        t.subject_id,
        t.created_at,
        u.email,
        s.name as subject_name
      FROM teachers t
      LEFT JOIN users u ON t.user_id = u.id
      LEFT JOIN subjects s ON t.subject_id = s.id
      ORDER BY t.created_at DESC
    `);
    
    return NextResponse.json({ teachers: result.rows });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teachers
 * Create a new teacher with user account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, subject_id, class_id, password } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المعلم مطلوب' },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // Hash the provided password or generate a temp one
      const passwordToHash = password || 'temp_password_' + Math.random().toString(36).substring(2, 8);
      const hashedPassword = await bcrypt.hash(passwordToHash, 10);
      
      // Create user record first
      const userResult = await query(
        'INSERT INTO users (email, password_hash, name, role) VALUES ($1, $2, $3, $4) RETURNING *',
        [email || null, hashedPassword, name, 'teacher']
      );

      const userId = userResult.rows[0].id;

      // Create teacher record
      const teacherResult = await query(
        'INSERT INTO teachers (user_id, name, phone, subject_id) VALUES ($1, $2, $3, $4) RETURNING *',
        [userId, name, phone || null, subject_id || null]
      );

      // Create teacher assignment if class_id and subject_id are provided
      if (subject_id && class_id) {
        await query(
          'INSERT INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES ($1, $2, $3)',
          [teacherResult.rows[0].id, class_id, subject_id]
        );
      }

      await query('COMMIT');

      return NextResponse.json({ 
        teacher: { 
          ...teacherResult.rows[0], 
          email: email || null,
          role: 'teacher'
        }, 
        message: SUCCESS_MESSAGES.CREATED 
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating teacher:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teachers
 * Update an existing teacher
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, subject_id, class_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المعلم مطلوب' },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // Update teacher
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (phone !== undefined) {
        updateFields.push(`phone = $${paramIndex++}`);
        updateValues.push(phone);
      }
      if (subject_id !== undefined) {
        updateFields.push(`subject_id = $${paramIndex++}`);
        updateValues.push(subject_id);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await query(
          `UPDATE teachers SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // Update teacher_assignments if class_id is provided
      if (class_id && subject_id) {
        const existingResult = await query(
          'SELECT id FROM teacher_assignments WHERE teacher_id = $1',
          [id]
        );

        if (existingResult.rows.length > 0) {
          await query(
            'UPDATE teacher_assignments SET class_id = $1, subject_id = $2 WHERE teacher_id = $3',
            [class_id, subject_id, id]
          );
        } else {
          await query(
            'INSERT INTO teacher_assignments (teacher_id, class_id, subject_id) VALUES ($1, $2, $3)',
            [id, class_id, subject_id]
          );
        }
      }

      await query('COMMIT');

      // Get updated teacher with user info
      const updatedTeacherResult = await query(`
        SELECT 
          t.id,
          t.name,
          t.phone,
          t.subject_id as primary_subject_id,
          t.created_at,
          t.updated_at,
          u.email,
          u.role
        FROM teachers t
        LEFT JOIN users u ON t.user_id = u.id
        WHERE t.id = $1
      `, [id]);

      return NextResponse.json({ 
        teacher: updatedTeacherResult.rows[0], 
        message: SUCCESS_MESSAGES.UPDATED 
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating teacher:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teachers
 * Delete a teacher
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المعلم مطلوب' },
        { status: 400 }
      );
    }

    // Get teacher to find user_id
    const teacherResult = await query(
      'SELECT user_id FROM teachers WHERE id = $1',
      [id]
    );

    if (teacherResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'المعلم غير موجود' },
        { status: 404 }
      );
    }

    const teacher = teacherResult.rows[0];

    await query('BEGIN');

    try {
      // Delete all related records first (in correct order to avoid foreign key issues)
      await query('DELETE FROM student_evaluations WHERE teacher_id = $1', [id]);
      await query('DELETE FROM exams WHERE teacher_id = $1', [id]);
      await query('DELETE FROM weekly_schedule WHERE teacher_id = $1', [id]);
      await query('DELETE FROM teacher_assignments WHERE teacher_id = $1', [id]);
      
      // Delete teacher
      await query('DELETE FROM teachers WHERE id = $1', [id]);

      // Delete user record
      if (teacher.user_id) {
        await query('DELETE FROM users WHERE id = $1', [teacher.user_id]);
      }

      await query('COMMIT');

      return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting teacher:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

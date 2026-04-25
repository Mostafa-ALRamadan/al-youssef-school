import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { rename, unlink } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/students
 * Returns all students or students by class
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    let result;
    if (classId) {
      result = await query(
        'SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone, p.address as parent_address FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN parents p ON s.parent_id = p.id WHERE s.class_id = $1 ORDER BY s.name',
        [classId]
      );
    } else {
      result = await query(
        'SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone, p.address as parent_address FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN parents p ON s.parent_id = p.id ORDER BY s.name'
      );
    }

    return NextResponse.json({ students: result.rows });
  } catch (error) {
    console.error('Error fetching students:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Creates a new student
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      class_id,
      parent_name,
      parent_phone,
      parent_address,
      parent_password,
      date_of_birth,
      gender
    } = body;

    if (!name || !class_id || !parent_name || !parent_phone) {
      return NextResponse.json(
        { error: 'الاسم، الصف، اسم ولي الأمر، وهاتف ولي الأمر مطلوبون' },
        { status: 400 }
      );
    }

    // Start transaction
    await query('BEGIN');

    try {
      // Check if parent exists by phone
      let parentResult = await query(
        'SELECT * FROM parents WHERE phone = $1',
        [parent_phone]
      );

      let parent;
      let isNewParent = false;
      let parentCredentials = null;
      if (parentResult.rows.length === 0) {
        // Create new parent
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const authEmail = `parent_${timestamp}_${randomStr}@alyoussef.local`;
        // Use admin-provided password or generate random if not provided
        const parentPassword = parent_password || Math.random().toString(36).substring(2, 10);
        const hashedPassword = await bcrypt.hash(parentPassword, 10);

        parentResult = await query(
          'INSERT INTO parents (name, phone, address, auth_email, password_hash) VALUES ($1, $2, $3, $4, $5) RETURNING *',
          [parent_name, parent_phone, parent_address || null, authEmail, hashedPassword]
        );
        parent = parentResult.rows[0];
        isNewParent = true;
        parentCredentials = { password: parentPassword };
      } else {
        parent = parentResult.rows[0];
      }

      // Generate login_name: Student full name only
      const loginName = name.trim();

      // Ensure uniqueness
      let finalLoginName = loginName;
      let counter = 1;
      while (true) {
        const existingResult = await query(
          'SELECT id FROM students WHERE login_name = $1',
          [finalLoginName]
        );
        if (existingResult.rows.length === 0) break;
        finalLoginName = `${loginName} ${counter}`;
        counter++;
      }

      // Create student
      const studentResult = await query(
        'INSERT INTO students (name, login_name, class_id, parent_id, date_of_birth, gender) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [name, finalLoginName, class_id, parent.id, date_of_birth || null, gender || null]
      );

      await query('COMMIT');

      return NextResponse.json({
        student: studentResult.rows[0],
        message: SUCCESS_MESSAGES.CREATED,
        ...(isNewParent && parentCredentials && {
          parent_credentials: parentCredentials,
          note: 'تم إنشاء ولي أمر جديد. الرجاء حفظ كلمة المرور.'
        })
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating student:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students?id=xxx
 * Updates a student
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const {
      name,
      class_id,
      parent_name,
      parent_phone,
      parent_address,
      date_of_birth,
      gender,
      image_url
    } = body;

    // Get current student
    const currentStudentResult = await query(
      'SELECT * FROM students WHERE id = $1',
      [id]
    );

    if (currentStudentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    const currentStudent = currentStudentResult.rows[0];
    const oldParentId = currentStudent.parent_id;

    // Delete old image if new image is being uploaded
    if (image_url !== undefined && image_url !== currentStudent.image_url && currentStudent.image_url) {
      try {
        const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const oldImagePath = join(uploadBasePath, currentStudent.image_url.replace('/uploads/', ''));
        if (existsSync(oldImagePath)) {
          await unlink(oldImagePath);
        }
      } catch (fileError) {
        console.error('Error deleting old student image:', fileError);
        // Continue even if file deletion fails
      }
    }

    await query('BEGIN');

    try {
      let parentId = currentStudent.parent_id;
      let parentChanged = false;

      // Handle parent updates
      if (parent_phone) {
        const existingParentResult = await query(
          'SELECT * FROM parents WHERE phone = $1',
          [parent_phone]
        );

        if (existingParentResult.rows.length > 0 && existingParentResult.rows[0].id !== currentStudent.parent_id) {
          // Phone belongs to different parent
          parentId = existingParentResult.rows[0].id;
          parentChanged = true;
        } else if (existingParentResult.rows.length > 0) {
          // Same parent - update info
          await query(
            'UPDATE parents SET name = $1, phone = $2, address = $3 WHERE id = $4',
            [parent_name || existingParentResult.rows[0].name, parent_phone, parent_address || existingParentResult.rows[0].address, existingParentResult.rows[0].id]
          );
        } else {
          // No parent with this phone exists - update current parent's phone
          await query(
            'UPDATE parents SET name = $1, phone = $2, address = $3 WHERE id = $4',
            [parent_name, parent_phone, parent_address || null, currentStudent.parent_id]
          );
        }
      }

      // Update student
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(name);
      }
      if (class_id !== undefined) {
        updateFields.push(`class_id = $${paramIndex++}`);
        updateValues.push(class_id);
      }
      if (parentId !== undefined) {
        updateFields.push(`parent_id = $${paramIndex++}`);
        updateValues.push(parentId);
      }
      if (date_of_birth !== undefined) {
        updateFields.push(`date_of_birth = $${paramIndex++}`);
        updateValues.push(date_of_birth);
      }
      if (gender !== undefined) {
        updateFields.push(`gender = $${paramIndex++}`);
        updateValues.push(gender);
      }
      if (image_url !== undefined) {
        updateFields.push(`image_url = $${paramIndex++}`);
        updateValues.push(image_url);
      }

      // Recalculate login_name if student name or parent name changed
      let finalLoginName = currentStudent.login_name;
      if (name !== undefined || parent_name !== undefined) {
        const newStudentName = name || currentStudent.name;
        
        // Get current parent's name
        const parentResult = await query(
          'SELECT name FROM parents WHERE id = $1',
          [parentId]
        );
        const currentParentName = parentResult.rows[0]?.name || '';
        const newParentName = parent_name || currentParentName;
        
        // Generate new login_name: Student full name only
        const loginName = newStudentName.trim();
        
        // Ensure uniqueness (exclude current student)
        finalLoginName = loginName;
        let counter = 1;
        while (true) {
          const existingResult = await query(
            'SELECT id FROM students WHERE login_name = $1 AND id != $2',
            [finalLoginName, id]
          );
          if (existingResult.rows.length === 0) break;
          finalLoginName = `${loginName} ${counter}`;
          counter++;
        }
        
        updateFields.push(`login_name = $${paramIndex++}`);
        updateValues.push(finalLoginName);
      }

      if (updateFields.length > 0) {
        updateValues.push(id);
        await query(
          `UPDATE students SET ${updateFields.join(', ')} WHERE id = $${paramIndex}`,
          updateValues
        );
      }

      // Clean up orphaned parent if changed
      if (parentChanged && oldParentId) {
        const siblingsResult = await query(
          'SELECT id FROM students WHERE parent_id = $1',
          [oldParentId]
        );
        
        if (siblingsResult.rows.length === 0) {
          await query('DELETE FROM parents WHERE id = $1', [oldParentId]);
        }
      }

      await query('COMMIT');

      // Rename image file if login_name changed and image exists
      if ((name !== undefined || parent_name !== undefined) && currentStudent.image_url) {
        try {
          const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
          const oldImagePath = join(uploadBasePath, currentStudent.image_url.replace('/uploads/', ''));
          if (existsSync(oldImagePath)) {
            const pathParts = currentStudent.image_url.split('/');
            const oldFilename = pathParts[pathParts.length - 1];
            const extension = oldFilename.split('.').pop() || 'jpg';
            
            // Get gender from current data
            const gender = currentStudent.gender;
            const genderLabel = gender === 'female' ? 'الطالبة' : 'الطالب';
            
            // Generate new filename with new login_name
            const timestamp = Date.now();
            const newFilename = `صورة_${genderLabel}_${finalLoginName}_${timestamp}.${extension}`;
            
            const newImagePath = join(uploadBasePath, 'student-image', newFilename);
            
            await rename(oldImagePath, newImagePath);
            
            // Update image_url in database
            const newImageUrl = `/uploads/student-image/${newFilename}`;
            await query('UPDATE students SET image_url = $1 WHERE id = $2', [newImageUrl, id]);
            
            // Update currentStudent for response
            currentStudent.image_url = newImageUrl;
          }
        } catch (fileError) {
          console.error('Error renaming image file:', fileError);
          // Continue even if file rename fails
        }
      }

      // Get updated student
      const updatedStudentResult = await query(
        'SELECT s.*, c.name as class_name, p.name as parent_name, p.phone as parent_phone, p.address as parent_address FROM students s LEFT JOIN classes c ON s.class_id = c.id LEFT JOIN parents p ON s.parent_id = p.id WHERE s.id = $1',
        [id]
      );

      return NextResponse.json({ 
        student: updatedStudentResult.rows[0], 
        message: SUCCESS_MESSAGES.UPDATED 
      });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error updating student:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students?id=xxx
 * Deletes a student
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'معرف الطالب مطلوب' },
        { status: 400 }
      );
    }
    
    // Get student to find parent
    const studentResult = await query(
      'SELECT * FROM students WHERE id = $1',
      [id]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 404 }
      );
    }

    const student = studentResult.rows[0];

    // Delete student image file if exists
    if (student.image_url) {
      try {
        const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const imagePath = join(uploadBasePath, student.image_url.replace('/uploads/', ''));
        if (existsSync(imagePath)) {
          await unlink(imagePath);
        }
      } catch (fileError) {
        console.error('Error deleting student image:', fileError);
        // Continue even if file deletion fails
      }
    }

    await query('BEGIN');

    try {
      // Delete student
      await query('DELETE FROM students WHERE id = $1', [id]);

      // Check if parent has other students
      if (student.parent_id) {
        const siblingsResult = await query(
          'SELECT id FROM students WHERE parent_id = $1',
          [student.parent_id]
        );
        
        if (siblingsResult.rows.length === 0) {
          // Delete orphaned parent
          await query('DELETE FROM parents WHERE id = $1', [student.parent_id]);
        }
      }

      await query('COMMIT');

      return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });

    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting student:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

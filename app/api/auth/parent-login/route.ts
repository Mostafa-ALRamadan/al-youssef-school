import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

/**
 * POST /api/auth/parent-login
 * Authenticates a parent using their login_name and password
 * Body: { login_name, password }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login_name, password } = body;

    if (!login_name || !password) {
      return NextResponse.json(
        { error: 'اسم المستخدم وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    // Find student by login_name, then get parent
    const studentResult = await query(
      'SELECT parent_id FROM students WHERE login_name = $1',
      [login_name]
    );

    const student = studentResult.rows[0];
    if (!student) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Get parent by parent_id
    const parentResult = await query(
      'SELECT * FROM parents WHERE id = $1',
      [student.parent_id]
    );

    const parent = parentResult.rows[0];

    if (!parent) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, parent.password_hash);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'بيانات الدخول غير صحيحة' },
        { status: 401 }
      );
    }

    // Get parent's children
    const studentsResult = await query(
      `SELECT s.id, s.name, c.id as class_id, c.name as class_name
       FROM students s
       JOIN classes c ON s.class_id = c.id
       WHERE s.parent_id = $1`,
      [parent.id]
    );

    const students = studentsResult.rows.map((s: any) => ({
      id: s.id,
      name: s.name,
      class: { id: s.class_id, name: s.class_name }
    })) || [];

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: parent.id, 
        role: 'parent',
        login_name: parent.login_name,
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      parent: {
        id: parent.id,
        name: parent.name,
        login_name: parent.login_name,
      },
      children: students,
      token: token,
    });
  } catch (error) {
    console.error('Error in parent login:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

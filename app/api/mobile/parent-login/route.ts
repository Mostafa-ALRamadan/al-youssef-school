import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * POST /api/mobile/parent-login
 * Parent login with child's login_name and parent password using JWT
 * Returns parent info and all their children
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { login_name, password } = body;

    if (!login_name || !password) {
      return NextResponse.json(
        { error: 'اسم المستخدم وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Find student by login_name and get parent info
    const studentResult = await query(
      `SELECT s.id as student_id, s.name as student_name, s.login_name, 
              s.parent_id, s.class_id, s.image_url,
              p.id as parent_id, p.name as parent_name, p.phone as parent_phone, p.password_hash
       FROM students s
       JOIN parents p ON s.parent_id = p.id
       WHERE s.login_name = $1`,
      [login_name]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'اسم المستخدم أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const student = studentResult.rows[0];
    const parent = {
      id: student.parent_id,
      name: student.parent_name,
      phone: student.parent_phone,
      password_hash: student.password_hash
    };

    // Verify parent password
    const isPasswordValid = await bcrypt.compare(password, parent.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'رقم الهاتف أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // Get all children for this parent
    const childrenResult = await query(
      `SELECT s.id, s.name, s.login_name, s.date_of_birth, s.gender, 
              s.image_url, s.class_id, c.name as class_name
       FROM students s
       LEFT JOIN classes c ON s.class_id = c.id
       WHERE s.parent_id = $1
       ORDER BY s.name`,
      [parent.id]
    );

    const children = childrenResult.rows;

    if (children.length === 0) {
      return NextResponse.json(
        { error: 'لا يوجد أطفال مرتبطين بهذا الحساب' },
        { status: 404 }
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: parent.id, 
        role: 'parent',
        phone: parent.phone
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return NextResponse.json({
      message: 'تم تسجيل الدخول بنجاح',
      token,
      parent: {
        id: parent.id,
        name: parent.name,
        phone: parent.phone
      },
      children: children
    });

  } catch (error) {
    console.error('Parent login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

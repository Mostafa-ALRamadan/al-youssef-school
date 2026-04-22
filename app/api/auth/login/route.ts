import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

/**
 * POST /api/auth/login
 * User login with email and password using JWT
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // Find user by email
    const userResult = await query(
      'SELECT id, email, password_hash, name, role, is_main_admin, active_session_id, last_login_at FROM users WHERE email = $1',
      [email]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    const user = userResult.rows[0];

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' },
        { status: 401 }
      );
    }

    // If admin, check if already logged in on another device
    if (user.role === 'admin') {
      // If there's an active session recorded and it's recent (within last 30 minutes)
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const hasRecentLogin = user.last_login_at && 
        new Date(user.last_login_at) > thirtyMinutesAgo;
      
      if (user.active_session_id && hasRecentLogin) {
        return NextResponse.json(
          { error: 'هذا الحساب قيد الاستخدام على جهاز آخر. يرجى تسجيل الخروج من الجهاز الأول أولاً.' },
          { status: 403 }
        );
      }
      
      // Record this new session as the active one using a proper UUID
      const sessionId = uuidv4();
      await query(
        'UPDATE users SET active_session_id = $1, last_login_at = CURRENT_TIMESTAMP WHERE id = $2',
        [sessionId, user.id]
      );
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        role: user.role,
        is_main_admin: user.is_main_admin 
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Update last login for non-admin users
    if (user.role !== 'admin') {
      await query(
        'UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
      );
    }

    // Get additional user data based on role
    let userData = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      is_main_admin: user.is_main_admin
    };

    if (user.role === 'teacher') {
      const teacherResult = await query(
        'SELECT id, phone, subject_id FROM teachers WHERE user_id = $1',
        [user.id]
      );
      if (teacherResult.rows.length > 0) {
        userData = { ...userData, ...teacherResult.rows[0] };
      }
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      token,
      user: userData
    });

  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

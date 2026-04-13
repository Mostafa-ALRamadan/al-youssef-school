import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

/**
 * POST /api/auth/login
 * Authenticates a user and returns session data
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

    const data = await AuthService.login(email, password);

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: data.user,
      session: data.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS },
      { status: 401 }
    );
  }
}

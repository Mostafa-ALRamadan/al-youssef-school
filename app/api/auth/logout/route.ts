import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/services';
import { SUCCESS_MESSAGES } from '@/constants';

/**
 * POST /api/auth/logout
 * Logs out the current user
 */
export async function POST(request: NextRequest) {
  try {
    await AuthService.logout();

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}

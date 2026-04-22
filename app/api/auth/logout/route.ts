import { NextRequest, NextResponse } from 'next/server';
import { SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * POST /api/auth/logout
 * Logs out the current user and clears admin session tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      try {
        // Verify JWT token
        const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string; role: string };
        
        // Clear active session tracking for admins
        if (decoded.role === 'admin') {
          await query(
            'UPDATE users SET active_session_id = null, last_login_at = null WHERE id = $1',
            [decoded.userId]
          );
        }
      } catch (jwtError) {
        // Token is invalid, but we still return success for logout
        console.log('Invalid token during logout:', jwtError);
      }
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';
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

    // Verify the JWT token
    const user = verifyToken(token);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user details from database
    const userResult = await query(
      'SELECT id, email, name, role, phone, is_main_admin, created_at, last_login_at FROM users WHERE id = $1',
      [user.userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    let userData = userResult.rows[0];

    // Get additional data based on role
    if (userData.role === 'teacher') {
      const teacherResult = await query(
        'SELECT id, phone, subject_id FROM teachers WHERE user_id = $1',
        [userData.id]
      );
      if (teacherResult.rows.length > 0) {
        userData = { ...userData, ...teacherResult.rows[0] };
      }
    }

    return NextResponse.json({ user: userData });
  } catch (error) {
    console.error('Auth me error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

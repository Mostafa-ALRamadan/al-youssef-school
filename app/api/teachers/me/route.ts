import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// GET /api/teachers/me
// Get current teacher info based on logged-in user
export async function GET(request: NextRequest) {
  try {
    // Try to get token from cookie first, then from Authorization header
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
    
    // Get teacher info with class and subject assignments
    const result = await query(
      `SELECT 
        t.id,
        t.name,
        t.user_id,
        ta.class_id,
        c.name as class_name,
        ta.subject_id,
        s.name as subject_name
      FROM teachers t
      LEFT JOIN teacher_assignments ta ON t.id = ta.teacher_id
      LEFT JOIN classes c ON ta.class_id = c.id
      LEFT JOIN subjects s ON ta.subject_id = s.id
      WHERE t.user_id = $1
      LIMIT 1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    return NextResponse.json({ teacher: result.rows[0] });
  } catch (error) {
    console.error('Error fetching teacher info:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher info' },
      { status: 500 }
    );
  }
}

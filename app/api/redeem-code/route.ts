import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// POST /api/redeem-code - Redeem access code (parent only)
export async function POST(request: Request) {
  try {
    // Try to get token from cookie first, then from Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'parent') {
      return NextResponse.json({ error: 'Parent access required' }, { status: 403 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    // Get all parent's students
    const studentResult = await query(
      'SELECT s.id, s.class_id, s.parent_id FROM students s JOIN parents p ON s.parent_id = p.id WHERE p.id = $1',
      [decoded.userId]
    );

    if (studentResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'No student found for this parent' },
        { status: 404 }
      );
    }

    // Find the access code
    const codeResult = await query(
      'SELECT * FROM access_codes WHERE code = $1',
      [code.toUpperCase()]
    );

    if (codeResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'Invalid code' },
        { status: 400 }
      );
    }

    const accessCode = codeResult.rows[0];

    // Find student that matches the code's class
    const student = studentResult.rows.find(s => s.class_id === accessCode.class_id);
    
    if (!student) {
      return NextResponse.json(
        { error: 'Code is not valid for any of your students', 
          debug: { 
            codeClass: accessCode.class_id, 
            yourStudentsClasses: studentResult.rows.map(s => s.class_id) 
          } 
        },
        { status: 400 }
      );
    }

    // Check if code is already used
    if (accessCode.is_used) {
      return NextResponse.json(
        { error: 'Code already used' },
        { status: 400 }
      );
    }

    // Check if code is expired
    if (accessCode.expires_at && new Date(accessCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'Code has expired' },
        { status: 400 }
      );
    }

    // Check if student already has access
    const existingAccessResult = await query(
      'SELECT id FROM student_video_access WHERE student_id = $1',
      [student.id]
    );

    if (existingAccessResult.rows.length > 0) {
      return NextResponse.json(
        { error: 'Student already has video access' },
        { status: 400 }
      );
    }

    // Mark code as used
    await query(
      'UPDATE access_codes SET is_used = true WHERE id = $1',
      [accessCode.id]
    );

    // Create student video access record
    const accessResult = await query(
      `INSERT INTO student_video_access (student_id, access_code_id) 
       VALUES ($1, $2) 
       RETURNING *`,
      [student.id, accessCode.id]
    );

    return NextResponse.json({
      message: 'Code redeemed successfully! You now have access to premium videos.',
      access: accessResult.rows[0]
    });
  } catch (error) {
    console.error('Error redeeming code:', error);
    return NextResponse.json(
      { error: 'Failed to redeem code' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';
import crypto from 'crypto';

// GET /api/access-codes - Get all access codes (admin only)
export async function GET(request: Request) {
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        ac.*,
        c.name as class_name,
        s.name as used_by_student_name,
        p.name as used_by_parent_name
      FROM access_codes ac
      LEFT JOIN classes c ON ac.class_id = c.id
      LEFT JOIN student_video_access sva ON sva.access_code_id = ac.id
      LEFT JOIN students s ON sva.student_id = s.id
      LEFT JOIN parents p ON s.parent_id = p.id
      ORDER BY ac.created_at DESC
    `);

    return NextResponse.json({ codes: result.rows });
  } catch (error) {
    console.error('Error fetching access codes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch access codes' },
      { status: 500 }
    );
  }
}

// POST /api/access-codes - Generate new access codes (admin only)
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
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { count = 1, class_id, expires_at } = body;

    if (!class_id) {
      return NextResponse.json(
        { error: 'Class is required' },
        { status: 400 }
      );
    }

    const generatedCodes = [];

    for (let i = 0; i < count; i++) {
      // Generate random 8-character code
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();

      const result = await query(
        `INSERT INTO access_codes (code, class_id, expires_at) 
         VALUES ($1, $2, $3) 
         RETURNING *`,
        [code, class_id, expires_at || null]
      );

      generatedCodes.push(result.rows[0]);
    }

    return NextResponse.json({ 
      message: `${count} code(s) generated successfully`,
      codes: generatedCodes 
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating access codes:', error);
    return NextResponse.json(
      { error: 'Failed to generate codes' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/premium-videos - Get videos based on user role
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
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Admin sees all videos
    if (decoded.role === 'admin') {
      const result = await query(`
        SELECT 
          pv.*,
          c.name as class_name
        FROM premium_videos pv
        LEFT JOIN classes c ON pv.class_id = c.id
        ORDER BY pv.created_at DESC
      `);
      return NextResponse.json({ videos: result.rows });
    }

    // Parent sees videos only if their student has access
    if (decoded.role === 'parent') {
      // Get all parent's students
      const studentResult = await query(
        'SELECT id, class_id FROM students WHERE parent_id = $1',
        [decoded.userId]
      );

      if (studentResult.rows.length === 0) {
        return NextResponse.json({ videos: [] });
      }

      const studentIds = studentResult.rows.map(s => s.id);
      const classIds = studentResult.rows.map(s => s.class_id);

      // Check if any student has video access
      const accessResult = await query(
        'SELECT student_id FROM student_video_access WHERE student_id = ANY($1)',
        [studentIds]
      );

      if (accessResult.rows.length === 0) {
        return NextResponse.json({ videos: [], hasAccess: false });
      }

      // Get classes that have access
      const accessedStudentIds = accessResult.rows.map(r => r.student_id);
      const accessedClassIds = studentResult.rows
        .filter(s => accessedStudentIds.includes(s.id))
        .map(s => s.class_id);

      // Return videos for all accessed classes
      const videosResult = await query(`
        SELECT 
          pv.*,
          c.name as class_name
        FROM premium_videos pv
        LEFT JOIN classes c ON pv.class_id = c.id
        WHERE pv.class_id = ANY($1)
        ORDER BY pv.created_at DESC
      `, [accessedClassIds]);

      return NextResponse.json({ 
        videos: videosResult.rows, 
        hasAccess: true 
      });
    }

    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  } catch (error) {
    console.error('Error fetching premium videos:', error);
    return NextResponse.json(
      { error: 'Failed to fetch videos' },
      { status: 500 }
    );
  }
}

// POST /api/premium-videos - Create video (admin only)
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
    const { title, description, youtube_url, class_id } = body;

    if (!title || !youtube_url || !class_id) {
      return NextResponse.json(
        { error: 'Title, YouTube URL, and class are required' },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO premium_videos (title, description, youtube_url, class_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [title, description || null, youtube_url, class_id]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating premium video:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}

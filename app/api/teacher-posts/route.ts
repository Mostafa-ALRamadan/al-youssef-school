import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// GET /api/teacher-posts
// For teachers: get their own posts
// For parents: get posts for their child's class (via class_id query param)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');
    const teacherId = searchParams.get('teacher_id');
    
    // Get current user from token
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    let userRole = 'parent';
    let userId = null;
    
    if (token) {
      try {
        const decoded: any = verifyToken(token);
        userRole = decoded.role || 'parent';
        userId = decoded.userId;
      } catch (e) {
        // Invalid token, treat as parent
      }
    }
    
    let sql = `
      SELECT 
        tp.id,
        tp.title,
        tp.content,
        tp.image_url,
        tp.video_url,
        tp.created_at,
        t.name as teacher_name,
        c.name as class_name,
        c.id as class_id,
        s.name as subject_name,
        s.id as subject_id,
        sem.name as semester_name
      FROM teacher_posts tp
      JOIN teachers t ON tp.teacher_id = t.id
      JOIN classes c ON tp.class_id = c.id
      JOIN subjects s ON tp.subject_id = s.id
      JOIN semesters sem ON tp.semester_id = sem.id
      WHERE 1=1
    `;
    
    const params: any[] = [];
    
    // Filter by class_id for parents
    if (classId) {
      sql += ` AND tp.class_id = $${params.length + 1}`;
      params.push(classId);
    }
    
    // Filter by teacher_id for teachers
    if (teacherId) {
      sql += ` AND tp.teacher_id = $${params.length + 1}`;
      params.push(teacherId);
    }
    
    // Order by newest first
    sql += ` ORDER BY tp.created_at DESC`;
    
    const result = await query(sql, params);
    
    return NextResponse.json({ posts: result.rows });
  } catch (error) {
    console.error('Error fetching teacher posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch teacher posts' },
      { status: 500 }
    );
  }
}

// POST /api/teacher-posts
// Create new post (teachers only)
export async function POST(request: NextRequest) {
  try {
    // Verify teacher authentication - check cookie or Authorization header
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
    
    let decoded: any;
    try {
      decoded = verifyToken(token);
    } catch (e) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }
    
    if (decoded?.role !== 'teacher') {
      return NextResponse.json({ error: 'Only teachers can create posts' }, { status: 403 });
    }
    
    const body = await request.json();
    const { title, content, image_url, video_url, class_id, subject_id } = body;
    
    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 });
    }
    
    if (!class_id || !subject_id) {
      return NextResponse.json({ error: 'Class and subject are required' }, { status: 400 });
    }
    
    // Get teacher_id from user_id
    const teacherResult = await query(
      'SELECT id FROM teachers WHERE user_id = $1',
      [decoded.userId]
    );
    
    if (teacherResult.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }
    
    const teacherId = teacherResult.rows[0].id;
    
    // Verify this teacher is assigned to this class and subject
    const assignmentResult = await query(
      `SELECT id FROM teacher_assignments 
       WHERE teacher_id = $1 AND class_id = $2 AND subject_id = $3`,
      [teacherId, class_id, subject_id]
    );
    
    if (assignmentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Teacher not assigned to this class/subject' }, { status: 403 });
    }
    
    // Get current active semester
    const semesterResult = await query(
      `SELECT id FROM semesters WHERE is_active = true LIMIT 1`
    );
    
    if (semesterResult.rows.length === 0) {
      return NextResponse.json({ error: 'No active semester found' }, { status: 400 });
    }
    
    const semesterId = semesterResult.rows[0].id;
    
    // Create the post
    const insertResult = await query(
      `INSERT INTO teacher_posts (teacher_id, class_id, subject_id, semester_id, title, content, image_url, video_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [teacherId, class_id, subject_id, semesterId, title || null, content, image_url || null, video_url || null]
    );
    
    return NextResponse.json({ post: insertResult.rows[0] }, { status: 201 });
  } catch (error) {
    console.error('Error creating teacher post:', error);
    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 }
    );
  }
}

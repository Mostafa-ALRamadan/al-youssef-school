import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/auth';

// PUT /api/teacher-posts/[id]
// Update a specific post (teachers can only update their own posts)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check cookie or Authorization header
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
      return NextResponse.json({ error: 'Only teachers can update posts' }, { status: 403 });
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
    
    // Get current post to delete old image if needed
    const currentPost = await query(
      'SELECT image_url FROM teacher_posts WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );
    
    if (currentPost.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or not authorized' }, { status: 403 });
    }
    
    const oldImageUrl = currentPost.rows[0].image_url;
    
    // Update the post
    const updateResult = await query(
      `UPDATE teacher_posts 
       SET title = $1, content = $2, image_url = $3, video_url = $4, class_id = $5, subject_id = $6
       WHERE id = $7
       RETURNING *`,
      [title || null, content, image_url || null, video_url || null, class_id, subject_id, id]
    );
    
    // Delete old image file if it exists and is different from new one
    if (oldImageUrl && oldImageUrl !== image_url && image_url) {
      try {
        // Extract filename from URL (e.g., /uploads/posts/image.jpg)
        const filename = oldImageUrl.split('/').pop();
        if (filename) {
          const fs = await import('fs/promises');
          const path = await import('path');
          const uploadBasePath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'public', 'uploads');
          const uploadDir = path.join(uploadBasePath, 'posts');
          const filePath = path.join(uploadDir, filename);
          
          // Delete the old file
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error('Error deleting old image file:', error);
        // Don't fail the request if image deletion fails
      }
    }
    
    return NextResponse.json({ post: updateResult.rows[0] });
  } catch (error) {
    console.error('Error updating teacher post:', error);
    return NextResponse.json(
      { error: 'Failed to update post' },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher-posts/[id]
// Delete a specific post (teachers can only delete their own posts)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Check cookie or Authorization header
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
      return NextResponse.json({ error: 'Only teachers can delete posts' }, { status: 403 });
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
    
    // Get the post to delete its image if it exists
    const postResult = await query(
      'SELECT image_url FROM teacher_posts WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );
    
    if (postResult.rows.length === 0) {
      return NextResponse.json({ error: 'Post not found or not authorized' }, { status: 403 });
    }
    
    // Delete the post
    const deleteResult = await query(
      'DELETE FROM teacher_posts WHERE id = $1 AND teacher_id = $2',
      [id, teacherId]
    );
    
    // Delete the image file if it exists
    const imageUrl = postResult.rows[0].image_url;
    if (imageUrl) {
      try {
        // Extract filename from URL (e.g., /uploads/posts/image.jpg)
        const filename = imageUrl.split('/').pop();
        if (filename) {
          const fs = await import('fs/promises');
          const path = await import('path');
          const uploadBasePath = process.env.UPLOAD_PATH || path.join(process.cwd(), 'public', 'uploads');
          const uploadDir = path.join(uploadBasePath, 'posts');
          const filePath = path.join(uploadDir, filename);
          
          // Delete the file
          await fs.unlink(filePath);
        }
      } catch (error) {
        console.error('Error deleting image file:', error);
        // Don't fail the request if image deletion fails
      }
    }
    
    return NextResponse.json({ success: true, message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Error deleting teacher post:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}

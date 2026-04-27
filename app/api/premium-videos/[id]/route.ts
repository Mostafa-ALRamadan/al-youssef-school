import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// PUT /api/premium-videos/[id] - Update video (admin only)
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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
      `UPDATE premium_videos 
       SET title = $1, description = $2, youtube_url = $3, class_id = $4
       WHERE id = $5
       RETURNING *`,
      [title, description || null, youtube_url, class_id, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating premium video:', error);
    return NextResponse.json(
      { error: 'Failed to update video' },
      { status: 500 }
    );
  }
}

// DELETE /api/premium-videos/[id] - Delete video (admin only)
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
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

    const result = await query(
      'DELETE FROM premium_videos WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('Error deleting premium video:', error);
    return NextResponse.json(
      { error: 'Failed to delete video' },
      { status: 500 }
    );
  }
}

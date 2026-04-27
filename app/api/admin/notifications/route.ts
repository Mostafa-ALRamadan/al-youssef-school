import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// GET /api/admin/notifications
// Get all notifications (admin only)
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('Authorization');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7) : null;

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin only' }, { status: 403 });
    }

    const result = await query(`
      SELECT 
        n.id,
        n.title,
        n.message,
        n.type,
        n.is_read,
        n.created_at,
        p.name as parent_name
      FROM notifications n
      LEFT JOIN parents p ON n.user_id = p.id
      ORDER BY n.created_at DESC
    `);

    return NextResponse.json({ notifications: result.rows });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

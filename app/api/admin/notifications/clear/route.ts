import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';

// POST /api/admin/notifications/clear
// Clear notifications older than X days (admin only)
export async function POST(request: NextRequest) {
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

    const { days = 365 } = await request.json();

    // Delete notifications older than specified days
    const result = await query(
      `DELETE FROM notifications 
       WHERE created_at < NOW() - INTERVAL '${days} days'
       RETURNING id`
    );

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.rows.length,
      message: `Deleted ${result.rows.length} notifications older than ${days} days`
    });
  } catch (error) {
    console.error('Error clearing notifications:', error);
    return NextResponse.json(
      { error: 'Failed to clear notifications' },
      { status: 500 }
    );
  }
}

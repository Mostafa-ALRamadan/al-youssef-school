import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// PUT /api/complaints/[id] - Update complaint status or add reply
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Get authenticated admin user
    const currentUser = getCurrentUser(request);
    if (!currentUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Handle reply update
    if (body.reply !== undefined) {
      const result = await query(
        `UPDATE complaints 
         SET reply = $1, replied_by = $2, replied_at = CURRENT_TIMESTAMP, status = 'resolved' 
         WHERE id = $3 
         RETURNING *`,
        [body.reply, currentUser.userId, id]
      );

      const complaint = result.rows[0];
      if (!complaint) {
        return NextResponse.json(
          { error: 'Complaint not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        message: 'تم إضافة الرد بنجاح',
        complaint,
      });
    }

    // Handle status update
    if (!body.status) {
      return NextResponse.json(
        { error: 'Status or reply is required' },
        { status: 400 }
      );
    }

    // Map Arabic status values to English DB status
    const statusMap: Record<string, string> = {
      'معلق': 'pending',
      'تم المراجعة': 'in_progress',
      'تم التنفيذ': 'resolved',
      'مرفوض': 'closed',
      // Also accept DB values directly
      'pending': 'pending',
      'in_progress': 'in_progress',
      'resolved': 'resolved',
      'closed': 'closed',
    };

    const dbStatus = statusMap[body.status];
    if (!dbStatus) {
      return NextResponse.json(
        { error: 'Invalid status. Must be: معلق, تم المراجعة, تم التنفيذ, or مرفوض' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
      [dbStatus, id]
    );

    const complaint = result.rows[0];
    if (!complaint) {
      return NextResponse.json(
        { error: 'Complaint not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      message: 'تم تحديث حالة الشكوى بنجاح',
      complaint,
    });
  } catch (error: any) {
    console.error('PUT /api/complaints/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/complaints/[id] - Delete complaint
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await query('DELETE FROM complaints WHERE id = $1', [id]);

    return NextResponse.json({
      message: 'تم حذف الشكوى بنجاح',
    });
  } catch (error: any) {
    console.error('DELETE /api/complaints/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

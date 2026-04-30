import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { deleteAuthUser, verifyToken } from '@/lib/auth';

// DELETE /api/admin/users/[userId] - Delete sub-admin only
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    // Get current user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const currentUser = verifyToken(token);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    // Get target user
    const targetUserResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    if (targetUserResult.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const targetUser = targetUserResult.rows[0];

    // Only allow deletion of sub-admins (role = 'admin' but not main admin)
    if (targetUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'يمكن حذف مشرفي النظام فقط من هذه الصفحة' },
        { status: 403 }
      );
    }

    // Prevent deletion of main admin
    if (targetUser.is_main_admin) {
      return NextResponse.json(
        { error: 'لا يمكن حذف حساب المدير الرئيسي' },
        { status: 403 }
      );
    }

    // Prevent self-deletion
    if (currentUser.userId === userId) {
      return NextResponse.json(
        { error: 'لا يمكنك حذف حسابك الخاص' },
        { status: 403 }
      );
    }

    // Delete the auth user
    const { error: deleteError } = await deleteAuthUser(userId);
    if (deleteError) {
      console.error('Delete auth user error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'تم حذف المشرف بنجاح'
    });

  } catch (error: any) {
    console.error('DELETE user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

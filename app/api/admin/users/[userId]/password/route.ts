import { NextRequest, NextResponse } from 'next/server';
import { updateAuthUser } from '@/lib/auth';
import { query } from '@/lib/db';
import bcrypt from 'bcryptjs';

// PUT /api/admin/users/[userId]/password - Reset user password
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { password, is_parent_account } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة مطلوبة' },
        { status: 400 }
      );
    }

    // Handle parent password separately
    if (is_parent_account) {
      const passwordHash = await bcrypt.hash(password, 10);
      await query(
        'UPDATE parents SET password_hash = $1 WHERE id = $2',
        [passwordHash, userId]
      );
      return NextResponse.json({
        message: 'تم تحديث كلمة المرور بنجاح'
      });
    }

    const { error } = await updateAuthUser(userId, { password });

    if (error) {
      console.error('Password update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'تم تحديث كلمة المرور بنجاح'
    });
  } catch (error: any) {
    console.error('PUT password error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

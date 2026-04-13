import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

// PUT /api/admin/users/[userId]/password - Reset user password
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json(
        { error: 'كلمة المرور الجديدة مطلوبة' },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.admin.updateUserById(userId, {
      password,
    });

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

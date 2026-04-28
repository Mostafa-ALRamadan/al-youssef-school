import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * PUT /api/mobile/notifications/{id}/read
 * Mark notification as read
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    await ParentMobileService.markNotificationRead(user.parentId, id);
    return NextResponse.json({ success: true, message: 'تم تحديد الإشعار كمقروء' });
  } catch (error) {
    console.error('Mobile notification read API error:', error);
    return NextResponse.json(
      { error: 'فشل في تحديد الإشعار كمقروء' },
      { status: 500 }
    );
  }
}

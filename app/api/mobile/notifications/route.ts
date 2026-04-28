import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/notifications
 * Returns notifications for logged-in parent
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const notifications = await ParentMobileService.getNotifications(user.parentId);
    return NextResponse.json({ notifications });
  } catch (error) {
    console.error('Mobile notifications API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الإشعارات' },
      { status: 500 }
    );
  }
}

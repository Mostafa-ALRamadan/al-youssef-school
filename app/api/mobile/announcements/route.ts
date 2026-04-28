import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/announcements
 * Returns school announcements for parents
 */
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const announcements = await ParentMobileService.getAnnouncements();

    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('Mobile announcements API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الإعلانات' },
      { status: 500 }
    );
  }
}

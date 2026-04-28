import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/premium-videos
 * Returns premium videos if student has access
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const result = await ParentMobileService.getPremiumVideos(user.parentId);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mobile premium videos API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الفيديوهات المميزة' },
      { status: 500 }
    );
  }
}

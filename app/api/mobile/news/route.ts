import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/news
 * Returns school news for parents
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

    const news = await ParentMobileService.getNews();

    return NextResponse.json({ news });
  } catch (error) {
    console.error('Mobile news API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الأخبار' },
      { status: 500 }
    );
  }
}

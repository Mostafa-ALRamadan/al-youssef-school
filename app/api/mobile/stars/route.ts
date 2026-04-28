import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/stars
 * Returns stars of the year for all classes
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const stars = await ParentMobileService.getStarsOfTheYear();
    return NextResponse.json({ stars });
  } catch (error) {
    console.error('Mobile stars API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب النجوم' },
      { status: 500 }
    );
  }
}

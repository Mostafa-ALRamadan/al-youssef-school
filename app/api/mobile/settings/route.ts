import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/settings
 * Returns mobile app settings including about video URL
 */
export async function GET(request: NextRequest) {
  try {
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const settings = await ParentMobileService.getSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Mobile settings API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الإعدادات' },
      { status: 500 }
    );
  }
}

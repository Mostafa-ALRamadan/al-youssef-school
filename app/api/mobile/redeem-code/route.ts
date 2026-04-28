import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * POST /api/mobile/redeem-code
 * Redeem access code for premium videos
 */
export async function POST(request: NextRequest) {
  try {
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { code } = body;

    if (!code || code.trim().length === 0) {
      return NextResponse.json(
        { error: 'الكود مطلوب' },
        { status: 400 }
      );
    }

    const result = await ParentMobileService.redeemCode(user.parentId, code.trim());
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Mobile redeem code API error:', error);
    return NextResponse.json(
      { error: error.message || 'فشل في استبدال الكود' },
      { status: 400 }
    );
  }
}

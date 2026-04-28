import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children
 * Returns all children for logged-in parent
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

    const children = await ParentMobileService.getChildren(user.parentId);

    return NextResponse.json({ children });
  } catch (error) {
    console.error('Mobile children API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الأبناء' },
      { status: 500 }
    );
  }
}

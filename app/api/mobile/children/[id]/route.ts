import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{id}
 * Returns detailed information for a specific child
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Verify authentication
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }

    const childId = id;
    const child = await ParentMobileService.getChildDetails(user.parentId, childId);

    if (!child) {
      return NextResponse.json(
        { error: 'الابن غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ child });
  } catch (error) {
    console.error('Mobile child details API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب تفاصيل الابن' },
      { status: 500 }
    );
  }
}

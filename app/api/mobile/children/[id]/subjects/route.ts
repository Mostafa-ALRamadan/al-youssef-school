import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{id}/subjects
 * Returns subjects for a specific child
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
    const subjects = await ParentMobileService.getChildSubjects(user.parentId, childId);

    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Mobile subjects API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المواد' },
      { status: 500 }
    );
  }
}

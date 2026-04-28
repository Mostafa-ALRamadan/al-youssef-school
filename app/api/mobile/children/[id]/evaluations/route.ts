import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{id}/evaluations
 * Returns student evaluations for a specific child
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const evaluations = await ParentMobileService.getChildEvaluations(user.parentId, id);
    return NextResponse.json({ evaluations });
  } catch (error) {
    console.error('Mobile evaluations API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب التقييمات' },
      { status: 500 }
    );
  }
}

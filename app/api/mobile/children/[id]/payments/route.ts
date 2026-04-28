import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{id}/payments
 * Returns payment information for a specific child
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

    const payments = await ParentMobileService.getChildPayments(user.parentId, id);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Mobile payments API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب المدفوعات' },
      { status: 500 }
    );
  }
}

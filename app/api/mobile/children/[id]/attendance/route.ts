import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{id}/attendance
 * Returns attendance records for a specific child
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

    const attendance = await ParentMobileService.getChildAttendance(user.parentId, id);
    return NextResponse.json({ attendance });
  } catch (error) {
    console.error('Mobile attendance API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب الحضور' },
      { status: 500 }
    );
  }
}

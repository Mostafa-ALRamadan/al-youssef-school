import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';
import { ComplaintService } from '@/services';

/**
 * POST /api/mobile/complaints
 * Send anonymous complaint/suggestion
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication (but don't expose parent identity in response)
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
    }

    const body = await request.json();
    const { title, message, type = 'suggestion' } = body;

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'الرسالة مطلوبة' },
        { status: 400 }
      );
    }

    // Rate limiting: 3 complaints per parent per day
    const dailyCount = await ComplaintService.getDailyComplaintCount(user.parentId);
    if (dailyCount >= 3) {
      return NextResponse.json(
        { error: 'لقد وصلت إلى الحد الأقصى من الشكاوى لهذا اليوم (3 شكاوى). يرجى المحاولة غداً.' },
        { status: 429 }
      );
    }

    const result = await ParentMobileService.sendComplaint(
      user.parentId,
      title?.trim() || 'Anonymous',
      message.trim(),
      type
    );
    return NextResponse.json(result);
  } catch (error) {
    console.error('Mobile complaints API error:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال الشكوى' },
      { status: 500 }
    );
  }
}

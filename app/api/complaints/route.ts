import { NextRequest, NextResponse } from 'next/server';
import { ComplaintService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

// GET /api/complaints - Get all complaints (admin only)
export async function GET(request: NextRequest) {
  try {
    const complaints = await ComplaintService.getAllComplaints();
    return NextResponse.json({ complaints });
  } catch (error) {
    console.error('GET /api/complaints error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/complaints - Submit new complaint (parents only)
export async function POST(request: NextRequest) {
  try {
    // Require authentication
    const user = getCurrentUser(request);
    if (!user || user.role !== 'parent') {
      return NextResponse.json(
        { error: 'يجب تسجيل الدخول كولي أمر لإرسال شكوى' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.title || !body.message) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    // Rate limiting: 3 complaints per parent per day
    const dailyCount = await ComplaintService.getDailyComplaintCount(user.userId);
    if (dailyCount >= 3) {
      return NextResponse.json(
        { error: 'لقد وصلت إلى الحد الأقصى من الشكاوى لهذا اليوم (3 شكاوى). يرجى المحاولة غداً.' },
        { status: 429 }
      );
    }

    // Create complaint with parent_id
    const complaint = await ComplaintService.submitComplaint(
      body.title,
      body.message,
      user.userId
    );

    if (!complaint) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الشكوى' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'تم إرسال الشكوى بنجاح', complaint },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/complaints error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

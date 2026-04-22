import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

// GET /api/announcements - Get all announcements
export async function GET(request: NextRequest) {
  try {
    const announcements = await AnnouncementService.getAllAnnouncements();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('GET /api/announcements error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/announcements - Create new announcement
export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const announcement = await AnnouncementService.createAnnouncement({
      ...body,
      created_by: user.userId,
    });

    return NextResponse.json(
      { message: 'تم إنشاء الإعلان بنجاح', announcement },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/announcements error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

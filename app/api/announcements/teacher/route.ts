import { NextRequest, NextResponse } from 'next/server';
import { AnnouncementService } from '@/services';

// GET /api/announcements/teacher - Get announcements for teachers
export async function GET(request: NextRequest) {
  try {
    const announcements = await AnnouncementService.getAnnouncementsForTeacher();
    return NextResponse.json({ announcements });
  } catch (error) {
    console.error('GET /api/announcements/teacher error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

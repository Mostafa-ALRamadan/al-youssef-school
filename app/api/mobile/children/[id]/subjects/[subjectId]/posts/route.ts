import { NextRequest, NextResponse } from 'next/server';
import { ParentMobileService } from '@/services/ParentMobileService';
import { getMobileUser } from '@/lib/mobile/auth';

/**
 * GET /api/mobile/children/{childId}/subjects/{subjectId}/posts
 * Returns teacher posts for a specific child and subject
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; subjectId: string }> }
) {
  try {
    const { id: childId, subjectId } = await params;
    
    // Verify authentication
    const user = await getMobileUser(request);
    if (!user) {
      return NextResponse.json(
        { error: 'غير مصرح' },
        { status: 401 }
      );
    }
    const posts = await ParentMobileService.getTeacherPosts(user.parentId, childId, subjectId);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Mobile teacher posts API error:', error);
    return NextResponse.json(
      { error: 'فشل في جلب منشورات المعلم' },
      { status: 500 }
    );
  }
}

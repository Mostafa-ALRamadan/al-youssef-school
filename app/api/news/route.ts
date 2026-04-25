import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/services';
import { getCurrentUser } from '@/lib/auth';

/**
 * GET /api/news
 * Returns list of news posts
 * Query params: published_only (optional, for mobile app)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published_only') === 'true';

    const news = await NewsService.getAllNews(publishedOnly);

    return NextResponse.json({
      news,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الأخبار' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/news
 * Creates a new news post (admin only)
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authentication
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      title,
      summary,
      content,
      image_url,
      is_published = true,
      is_pinned = false,
    } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'العنوان والمحتوى مطلوبان' },
        { status: 400 }
      );
    }

    const news = await NewsService.createNews({
      title,
      summary,
      content,
      image_url,
      is_published,
      is_pinned,
    });

    return NextResponse.json({
      news,
      message: 'تم إنشاء الخبر بنجاح',
    });
  } catch (error) {
    console.error('Error creating news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء إنشاء الخبر' },
      { status: 500 }
    );
  }
}

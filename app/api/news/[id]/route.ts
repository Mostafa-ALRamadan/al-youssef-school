import { NextRequest, NextResponse } from 'next/server';
import { NewsService } from '@/services';
import { getCurrentUser } from '@/lib/auth';
import { unlink, rename } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * GET /api/news/[id]
 * Returns a single news post by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // For public access (mobile app), only return published news
    const { searchParams } = new URL(request.url);
    const publishedOnly = searchParams.get('published_only') === 'true';

    const news = await NewsService.getNewsById(id, publishedOnly);

    if (!news) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      news,
    });
  } catch (error) {
    console.error('Error fetching news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء جلب الخبر' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/news/[id]
 * Updates a news post (admin only)
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;
    const body = await request.json();
    const {
      title,
      summary,
      content,
      image_url,
      video_url,
      is_published,
      is_pinned,
    } = body;

    // Check if news exists and get current image_url for deletion
    const existingNews = await NewsService.getNewsById(id);
    if (!existingNews) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    // Delete old image if new image is being uploaded
    if (image_url !== undefined && image_url !== existingNews.image_url && existingNews.image_url) {
      try {
        const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const oldImagePath = join(uploadBasePath, existingNews.image_url.replace('/uploads/', ''));
        if (existsSync(oldImagePath)) {
          await unlink(oldImagePath);
        }
      } catch (fileError) {
        console.error('Error deleting old news image:', fileError);
        // Continue even if file deletion fails
      }
    }

    // Check if any fields were provided
    const hasUpdates = title !== undefined || summary !== undefined || content !== undefined ||
                       image_url !== undefined || video_url !== undefined || is_published !== undefined || is_pinned !== undefined;

    if (!hasUpdates) {
      return NextResponse.json(
        { error: 'لم يتم تقديم أي بيانات للتحديث' },
        { status: 400 }
      );
    }

    const news = await NewsService.updateNews(id, {
      title,
      summary,
      content,
      image_url,
      video_url,
      is_published,
      is_pinned,
    });

    // Rename image file if title changed and image exists and no new image uploaded
    if (title !== undefined && title !== existingNews.title && existingNews.image_url && image_url === existingNews.image_url) {
      try {
        const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const oldImagePath = join(uploadBasePath, existingNews.image_url.replace('/uploads/', ''));
        if (existsSync(oldImagePath)) {
          const pathParts = existingNews.image_url.split('/');
          const oldFilename = pathParts[pathParts.length - 1];
          const extension = oldFilename.split('.').pop() || 'jpg';
          
          // Generate new filename with new title and timestamp
          const timestamp = Date.now();
          // Sanitize title for filename (remove special chars, keep Arabic)
          const sanitizedTitle = title.replace(/[<>:"/\\|?*]/g, '').substring(0, 50);
          const newFilename = `${sanitizedTitle}_${timestamp}.${extension}`;
          
          const newImagePath = join(uploadBasePath, 'news', newFilename);
          
          await rename(oldImagePath, newImagePath);
          
          // Update image_url in database
          const newImageUrl = `/uploads/news/${newFilename}`;
          await NewsService.updateNews(id, { image_url: newImageUrl });
          
          // Update news object for response
          if (news) {
            news.image_url = newImageUrl;
          }
        }
      } catch (fileError) {
        console.error('Error renaming news image:', fileError);
        // Continue even if file rename fails
      }
    }

    return NextResponse.json({
      news,
      message: 'تم تحديث الخبر بنجاح',
    });
  } catch (error) {
    console.error('Error updating news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تحديث الخبر' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/news/[id]
 * Deletes a news post (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check admin authentication
    const user = await getCurrentUser(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await params;

    // Check if news exists and get image_url for deletion
    const existingNews = await NewsService.getNewsById(id);
    if (!existingNews) {
      return NextResponse.json(
        { error: 'الخبر غير موجود' },
        { status: 404 }
      );
    }

    // Delete image file if exists
    if (existingNews.image_url) {
      try {
        const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
        const imagePath = join(uploadBasePath, existingNews.image_url.replace('/uploads/', ''));
        if (existsSync(imagePath)) {
          await unlink(imagePath);
        }
      } catch (fileError) {
        console.error('Error deleting news image:', fileError);
        // Continue even if file deletion fails
      }
    }

    const deleted = await NewsService.deleteNews(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'لم يتم حذف الخبر' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      message: 'تم حذف الخبر بنجاح',
    });
  } catch (error) {
    console.error('Error deleting news:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء حذف الخبر' },
      { status: 500 }
    );
  }
}

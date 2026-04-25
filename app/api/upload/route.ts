import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { existsSync } from 'fs';

// POST /api/upload - Upload images
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const type = formData.get('type') as string || 'general';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File size must be less than 5MB' },
        { status: 400 }
      );
    }

    // Get custom filename or generate one
    const customFilename = formData.get('filename') as string;
    const timestamp = Date.now();
    const extension = file.name.split('.').pop() || 'jpg';
    // Sanitize filename: remove problematic chars but keep spaces
    const sanitizeFilename = (name: string) => {
      return name
        .replace(/[<>:"/\\|?*]/g, '')
        .substring(0, 100); // Limit length
    };
    const filename = customFilename 
      ? `${sanitizeFilename(customFilename)}_${timestamp}.${extension}`
      : `${type}_${timestamp}_${Math.random().toString(36).substring(2, 8)}.${extension}`;

    // Create uploads directory if it doesn't exist
    const uploadBasePath = process.env.UPLOAD_PATH || join(process.cwd(), 'public', 'uploads');
    const uploadsDir = join(uploadBasePath, type);
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Write file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const filepath = join(uploadsDir, filename);
    await writeFile(filepath, buffer);

    // Return public URL (relative to public/uploads)
    const url = `/uploads/${type}/${filename}`;

    return NextResponse.json({
      success: true,
      url,
      filename,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

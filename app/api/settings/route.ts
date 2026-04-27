import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import { cookies } from 'next/headers';

// GET /api/settings - Get app settings (public endpoint for about video)
export async function GET() {
  try {
    const result = await query(
      'SELECT about_video_url FROM app_settings LIMIT 1'
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ about_video_url: null });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

// PUT /api/settings - Update app settings (admin only)
export async function PUT(request: Request) {
  try {
    // Try to get token from cookie first, then from Authorization header
    const cookieStore = await cookies();
    let token = cookieStore.get('auth_token')?.value;
    
    if (!token) {
      const authHeader = request.headers.get('Authorization');
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded || decoded.role !== 'admin') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { about_video_url } = body;

    // Get the first settings row
    const existingResult = await query('SELECT id FROM app_settings LIMIT 1');

    if (existingResult.rows.length === 0) {
      // Insert new row if none exists
      const result = await query(
        'INSERT INTO app_settings (about_video_url) VALUES ($1) RETURNING *',
        [about_video_url || null]
      );
      return NextResponse.json(result.rows[0]);
    } else {
      // Update existing row
      const result = await query(
        'UPDATE app_settings SET about_video_url = $1, updated_at = timezone(\'utc\', now()) RETURNING *',
        [about_video_url || null]
      );
      return NextResponse.json(result.rows[0]);
    }
  } catch (error) {
    console.error('Error updating settings:', error);
    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

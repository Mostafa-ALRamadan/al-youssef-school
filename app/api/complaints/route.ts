import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET /api/complaints - Get all complaints (admin only)
export async function GET(request: NextRequest) {
  try {
        
    // Get complaints with admin replier info only
    const complaintsResult = await query(`
      SELECT 
        c.*,
        CASE 
          WHEN c.replied_by IS NOT NULL THEN admin.email
        END as replier_name
      FROM complaints c
      LEFT JOIN users admin ON c.replied_by = admin.id
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({ complaints: complaintsResult.rows });
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
    const today = new Date().toISOString().split('T')[0];
    const countResult = await query(
      "SELECT COUNT(*) as count FROM complaints WHERE parent_id = $1 AND created_at >= $2 AND created_at < $3",
      [user.userId, `${today}T00:00:00.000Z`, `${today}T23:59:59.999Z`]
    );
    
    const dailyCount = parseInt(countResult.rows[0].count);
    if (dailyCount >= 3) {
      return NextResponse.json(
        { error: 'لقد وصلت إلى الحد الأقصى من الشكاوى لهذا اليوم (3 شكاوى). يرجى المحاولة غداً.' },
        { status: 429 }
      );
    }

    // Create complaint with parent_id
    const createResult = await query(
      'INSERT INTO complaints (title, message, status, parent_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [body.title, body.message, 'pending', user.userId]
    );
    const complaint = createResult.rows[0];

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

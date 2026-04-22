import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// GET /api/semesters - Get all semesters with year names
export async function GET() {
  try {
    const result = await query(
      `SELECT s.id, s.name, s.academic_year_id, s.is_active, s.start_date, s.end_date,
              ay.name as academic_year_name
       FROM semesters s
       LEFT JOIN academic_years ay ON s.academic_year_id = ay.id
       ORDER BY s.start_date ASC`
    );

    // Format dates as YYYY-MM-DD strings to avoid timezone issues
    // PostgreSQL DATE returns a Date object, extract YYYY-MM-DD directly
    const formatDate = (date: Date | null) => {
      if (!date) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formattedRows = result.rows.map(row => ({
      ...row,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
    }));

    return NextResponse.json({ semesters: formattedRows });
  } catch (error: any) {
    console.error('GET semesters error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/semesters - Create a new semester
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { academic_year_id, name, start_date, end_date } = body;

    if (!academic_year_id || !name || !start_date || !end_date) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    const result = await query(
      'INSERT INTO semesters (academic_year_id, name, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
      [academic_year_id, name, start_date, end_date]
    );

    return NextResponse.json({ semester: result.rows[0] });
  } catch (error: any) {
    console.error('POST semesters error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

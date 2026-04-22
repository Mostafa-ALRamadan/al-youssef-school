import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/academic-years/set-active - Set an academic year as active
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { yearId } = body;

    if (!yearId) {
      return NextResponse.json(
        { error: 'معرف السنة الدراسية مطلوب' },
        { status: 400 }
      );
    }

    // Deactivate all academic years
    await query('UPDATE academic_years SET is_active = false');

    // Deactivate all semesters
    await query('UPDATE semesters SET is_active = false');

    // Activate the selected year
    await query(
      'UPDATE academic_years SET is_active = true WHERE id = $1',
      [yearId]
    );

    // Activate the first semester of this year (if any exists)
    await query(
      `UPDATE semesters SET is_active = true 
       WHERE id = (SELECT id FROM semesters WHERE academic_year_id = $1 ORDER BY start_date LIMIT 1)`,
      [yearId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'تم تفعيل السنة الدراسية بنجاح'
    });
  } catch (error: any) {
    console.error('Set active year error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

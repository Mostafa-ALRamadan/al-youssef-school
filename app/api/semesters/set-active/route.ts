import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// POST /api/semesters/set-active - Set a semester as active (and its year)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { semesterId } = body;

    if (!semesterId) {
      return NextResponse.json(
        { error: 'معرف الفصل الدراسي مطلوب' },
        { status: 400 }
      );
    }

    // Get the semester's academic year ID
    const semesterResult = await query(
      'SELECT academic_year_id FROM semesters WHERE id = $1',
      [semesterId]
    );

    if (semesterResult.rows.length === 0) {
      return NextResponse.json(
        { error: 'الفصل الدراسي غير موجود' },
        { status: 404 }
      );
    }

    const academicYearId = semesterResult.rows[0].academic_year_id;

    // Deactivate all academic years
    await query('UPDATE academic_years SET is_active = false');

    // Deactivate all semesters
    await query('UPDATE semesters SET is_active = false');

    // Activate the selected academic year
    await query(
      'UPDATE academic_years SET is_active = true WHERE id = $1',
      [academicYearId]
    );

    // Activate the selected semester
    await query(
      'UPDATE semesters SET is_active = true WHERE id = $1',
      [semesterId]
    );

    return NextResponse.json({ 
      success: true,
      message: 'تم تفعيل الفصل الدراسي والسنة الدراسية بنجاح'
    });
  } catch (error: any) {
    console.error('Set active semester error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

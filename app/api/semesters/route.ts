import { NextResponse } from 'next/server';
import { SemesterService } from '@/services';

// GET /api/semesters - Get all semesters with year names
export async function GET() {
  try {
    const semesters = await SemesterService.getAllSemestersWithYearNames();
    return NextResponse.json({ semesters });
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

    const semester = await SemesterService.createSemester({
      academic_year_id,
      name,
      start_date,
      end_date
    });

    if (!semester) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الفصل الدراسي' },
        { status: 500 }
      );
    }

    return NextResponse.json({ semester });
  } catch (error: any) {
    console.error('POST semesters error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

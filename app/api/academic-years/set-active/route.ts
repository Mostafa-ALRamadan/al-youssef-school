import { NextResponse } from 'next/server';
import { AcademicYearService } from '@/services';

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

    const success = await AcademicYearService.setActiveAcademicYear(yearId);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في تفعيل السنة الدراسية' },
        { status: 500 }
      );
    }

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

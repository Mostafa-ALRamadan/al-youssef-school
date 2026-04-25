import { NextResponse } from 'next/server';
import { SemesterService } from '@/services';

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

    const success = await SemesterService.setActiveSemesterWithYear(semesterId);

    if (!success) {
      return NextResponse.json(
        { error: 'الفصل الدراسي غير موجود' },
        { status: 404 }
      );
    }

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

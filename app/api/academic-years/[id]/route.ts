import { NextResponse } from 'next/server';
import { AcademicYearService } from '@/services';

// DELETE /api/academic-years/[id] - Delete an academic year
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await AcademicYearService.deleteAcademicYearWithSemesters(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'السنة الدراسية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف السنة الدراسية بنجاح'
    });
  } catch (error: any) {
    console.error('Delete academic year error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/academic-years/[id] - Update an academic year
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, start_date, end_date } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم السنة الدراسية مطلوب' },
        { status: 400 }
      );
    }

    const academicYear = await AcademicYearService.updateAcademicYear(id, { name, start_date, end_date });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'السنة الدراسية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      academicYear,
      message: 'تم تحديث السنة الدراسية بنجاح'
    });
  } catch (error: any) {
    console.error('Update academic year error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

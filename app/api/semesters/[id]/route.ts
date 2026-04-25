import { NextResponse } from 'next/server';
import { SemesterService } from '@/services';

// DELETE /api/semesters/[id] - Delete a semester
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const deleted = await SemesterService.deleteSemester(id);

    if (!deleted) {
      return NextResponse.json(
        { error: 'الفصل الدراسي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف الفصل الدراسي بنجاح'
    });
  } catch (error: any) {
    console.error('Delete semester error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// PUT /api/semesters/[id] - Update a semester
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
        { error: 'اسم الفصل الدراسي مطلوب' },
        { status: 400 }
      );
    }

    const semester = await SemesterService.updateSemester(id, { name, start_date, end_date });

    if (!semester) {
      return NextResponse.json(
        { error: 'الفصل الدراسي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      semester,
      message: 'تم تحديث الفصل الدراسي بنجاح'
    });
  } catch (error: any) {
    console.error('Update semester error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

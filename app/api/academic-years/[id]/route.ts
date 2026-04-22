import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// DELETE /api/academic-years/[id] - Delete an academic year
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Delete related semesters first (cascade will handle this, but let's be explicit)
    await query('DELETE FROM semesters WHERE academic_year_id = $1', [id]);

    // Delete the academic year
    const result = await query('DELETE FROM academic_years WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
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

    const result = await query(
      'UPDATE academic_years SET name = $1, start_date = $2, end_date = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
      [name, start_date, end_date, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'السنة الدراسية غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      academicYear: result.rows[0],
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

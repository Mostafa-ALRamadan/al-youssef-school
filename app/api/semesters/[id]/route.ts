import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// DELETE /api/semesters/[id] - Delete a semester
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query('DELETE FROM semesters WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
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

    const result = await query(
      'UPDATE semesters SET name = $1, start_date = $2, end_date = $3 WHERE id = $4 RETURNING *',
      [name, start_date, end_date, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'الفصل الدراسي غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      semester: result.rows[0],
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

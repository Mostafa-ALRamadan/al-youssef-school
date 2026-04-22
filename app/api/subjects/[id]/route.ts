import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

// PUT /api/subjects/[id] - Update a subject
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المادة مطلوب' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      subject: result.rows[0],
      message: 'تم تحديث المادة بنجاح'
    });
  } catch (error: any) {
    console.error('Update subject error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/subjects/[id] - Delete a subject
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await query('DELETE FROM subjects WHERE id = $1 RETURNING *', [id]);

    if (result.rowCount === 0) {
      return NextResponse.json(
        { error: 'المادة غير موجودة' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف المادة بنجاح'
    });
  } catch (error: any) {
    console.error('Delete subject error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

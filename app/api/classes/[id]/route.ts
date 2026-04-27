import { NextResponse } from 'next/server';
import { ClassService } from '@/services';

// PUT /api/classes/[id] - Update a class
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
        { error: 'اسم الصف مطلوب' },
        { status: 400 }
      );
    }

    const updatedClass = await ClassService.updateClass(id, { name });

    if (!updatedClass) {
      return NextResponse.json(
        { error: 'الصف غير موجود' },
        { status: 404 }
      );
    }

    return NextResponse.json({ 
      class: updatedClass,
      message: 'تم تحديث الصف بنجاح'
    });
  } catch (error: any) {
    console.error('Update class error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/classes/[id] - Delete a class
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const result = await ClassService.deleteClass(id);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'الصف غير موجود' },
        { status: result.error ? 400 : 404 }
      );
    }

    return NextResponse.json({ 
      success: true,
      message: 'تم حذف الصف بنجاح'
    });
  } catch (error: any) {
    console.error('Delete class error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

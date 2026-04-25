import { NextRequest, NextResponse } from 'next/server';
import { StudentFeeService } from '@/services';

/**
 * GET /api/fees/[id]
 * Returns a specific student fee with payment summary
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const fee = await StudentFeeService.getFeeById(id);
    
    if (!fee) {
      return NextResponse.json(
        { error: 'لم يتم العثور على سجل الأقساط' },
        { status: 404 }
      );
    }

    return NextResponse.json({ fee });
  } catch (error) {
    console.error('Get fee error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات القسط' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/fees/[id]
 * Updates a student fee record
 * Body: { school_fee, transport_fee }
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { school_fee, transport_fee } = body;

    const fee = await StudentFeeService.updateStudentFee(id, {
      school_fee,
      transport_fee,
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'فشل في تحديث سجل الأقساط' },
        { status: 500 }
      );
    }

    return NextResponse.json({ fee });
  } catch (error) {
    console.error('Update fee error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث سجل الأقساط' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fees/[id]
 * Deletes a student fee record
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const success = await StudentFeeService.deleteStudentFee(id);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف سجل الأقساط' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete fee error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف سجل الأقساط' },
      { status: 500 }
    );
  }
}

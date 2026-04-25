import { NextRequest, NextResponse } from 'next/server';
import { StudentFeeService } from '@/services';

/**
 * PUT /api/fees/[id]/payments/[paymentId]
 * Updates a payment
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const body = await request.json();
    const { amount, payment_date, payment_method, notes } = body;

    const payment = await StudentFeeService.updatePayment(paymentId, {
      amount,
      payment_date,
      payment_method,
      notes,
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'فشل في تحديث الدفعة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ payment });
  } catch (error) {
    console.error('Update payment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في تحديث الدفعة' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/fees/[id]/payments/[paymentId]
 * Deletes a payment
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const success = await StudentFeeService.deletePayment(paymentId);

    if (!success) {
      return NextResponse.json(
        { error: 'فشل في حذف الدفعة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete payment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في حذف الدفعة' },
      { status: 500 }
    );
  }
}

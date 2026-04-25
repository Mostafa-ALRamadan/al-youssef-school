import { NextRequest, NextResponse } from 'next/server';
import { StudentFeeService } from '@/services';

/**
 * GET /api/fees/[id]/payments
 * Returns payment history for a student fee
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const payments = await StudentFeeService.getPaymentHistory(id);
    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب سجل الدفعات' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fees/[id]/payments
 * Adds a new payment
 * Body: { amount, payment_date, payment_method, notes }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { amount, payment_date, payment_method, notes, created_by } = body;

    if (!amount || !payment_method) {
      return NextResponse.json(
        { error: 'المبلغ وطريقة الدفع مطلوبة' },
        { status: 400 }
      );
    }

    const result = await StudentFeeService.addPayment(
      id,
      amount,
      payment_date || new Date().toISOString().split('T')[0],
      payment_method,
      notes,
      created_by
    );

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 400 }
      );
    }

    return NextResponse.json({ payment: result.payment });
  } catch (error) {
    console.error('Add payment error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إضافة الدفعة' },
      { status: 500 }
    );
  }
}

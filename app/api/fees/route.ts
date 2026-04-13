import { NextRequest, NextResponse } from 'next/server';
import { PaymentService } from '@/services';
import { ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/fees
 * Returns payment records
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let payments;
    if (status === 'pending') {
      payments = await PaymentService.getPendingPayments();
    } else {
      payments = await PaymentService.getAllPayments();
    }

    return NextResponse.json({ payments });
  } catch (error) {
    console.error('Get payments error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

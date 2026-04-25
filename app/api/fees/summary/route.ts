import { NextResponse } from 'next/server';
import { StudentFeeService } from '@/services';

/**
 * GET /api/fees/summary
 * Returns financial summary for admin dashboard
 */
export async function GET() {
  try {
    const summary = await StudentFeeService.getFinancialSummary();
    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Get fees summary error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب ملخص الأقساط' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { StudentFeeService } from '@/services';

/**
 * GET /api/fees
 * Returns all student fees with payment summaries
 */
export async function GET() {
  try {
    const fees = await StudentFeeService.getAllFees();
    return NextResponse.json({ fees });
  } catch (error) {
    console.error('Get fees error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في جلب بيانات الأقساط' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/fees
 * Creates a new student fee record
 * Body: { student_id, academic_year_id, school_fee, transport_fee }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_id, academic_year_id, school_fee, transport_fee } = body;

    if (!student_id || !academic_year_id) {
      return NextResponse.json(
        { error: 'معرف الطالب والسنة الدراسية مطلوبان' },
        { status: 400 }
      );
    }

    const fee = await StudentFeeService.createStudentFee({
      student_id,
      academic_year_id,
      school_fee: school_fee || 0,
      transport_fee: transport_fee || 0,
    });

    if (!fee) {
      return NextResponse.json(
        { error: 'فشل في إنشاء سجل الأقساط' },
        { status: 500 }
      );
    }

    return NextResponse.json({ fee });
  } catch (error) {
    console.error('Create fee error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ في إنشاء سجل الأقساط' },
      { status: 500 }
    );
  }
}

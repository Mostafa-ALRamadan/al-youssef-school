import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { AcademicYearService } from '@/services';

/**
 * GET /api/academic-years
 * Returns all academic years
 */
export async function GET(request: NextRequest) {
  try {
    const academicYears = await AcademicYearService.getAllAcademicYears();
    return NextResponse.json({ academicYears });
  } catch (error) {
    console.error('Error fetching academic years:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/academic-years
 * Create a new academic year
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, start_date, end_date } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم السنة الدراسية مطلوب' },
        { status: 400 }
      );
    }

    const academicYear = await AcademicYearService.createAcademicYear({ name, start_date, end_date });

    if (!academicYear) {
      return NextResponse.json(
        { error: 'فشل في إنشاء السنة الدراسية' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      academicYear, 
      message: SUCCESS_MESSAGES.CREATED 
    });
  } catch (error) {
    console.error('Error creating academic year:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}


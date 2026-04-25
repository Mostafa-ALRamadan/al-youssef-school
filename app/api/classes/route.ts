import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { ClassService } from '@/services';

/**
 * GET /api/classes
 * Returns all classes
 */
export async function GET(request: NextRequest) {
  try {
    const classes = await ClassService.getAllClasses();
    return NextResponse.json({ classes });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/classes
 * Create a new class
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الصف مطلوب' },
        { status: 400 }
      );
    }

    const newClass = await ClassService.createClass({ name });

    if (!newClass) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الصف' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      class: newClass, 
      message: SUCCESS_MESSAGES.CREATED 
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}


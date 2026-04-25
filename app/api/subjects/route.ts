import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { SubjectService } from '@/services';

/**
 * GET /api/subjects
 * Returns all subjects
 */
export async function GET(request: NextRequest) {
  try {
    const subjects = await SubjectService.getAllSubjects();
    return NextResponse.json({ subjects });
  } catch (error) {
    console.error('Error fetching subjects:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/subjects
 * Create a new subject
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name } = body;

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المادة مطلوب' },
        { status: 400 }
      );
    }

    const subject = await SubjectService.createSubject({ name });

    if (!subject) {
      return NextResponse.json(
        { error: 'فشل في إنشاء المادة' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      subject, 
      message: SUCCESS_MESSAGES.CREATED 
    });
  } catch (error) {
    console.error('Error creating subject:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

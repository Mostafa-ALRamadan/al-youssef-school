import { NextRequest, NextResponse } from 'next/server';
import { StudentService } from '@/services';
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from '@/constants';

/**
 * GET /api/students
 * Returns all students
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classId = searchParams.get('class_id');

    let students;
    if (classId) {
      students = await StudentService.getStudentsByClass(classId);
    } else {
      students = await StudentService.getAllStudents();
    }

    return NextResponse.json({ students });
  } catch (error) {
    console.error('Get students error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/students
 * Creates a new student
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const student = await StudentService.createStudent(body);

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.CREATED, student },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Create student error:', error);
    return NextResponse.json(
      { error: error?.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/students?id=xxx
 * Updates a student
 */
export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const student = await StudentService.updateStudent(id, body);

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.UPDATED, student },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Update student error:', error);
    return NextResponse.json(
      { error: error?.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/students?id=xxx
 * Deletes a student
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { error: 'Student ID is required' },
        { status: 400 }
      );
    }
    
    await StudentService.deleteStudent(id);

    return NextResponse.json(
      { message: SUCCESS_MESSAGES.DELETED },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Delete student error:', error);
    return NextResponse.json(
      { error: error?.message || ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

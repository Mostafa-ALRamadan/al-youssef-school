import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';

/**
 * GET /api/classes
 * Returns all classes
 */
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM classes ORDER BY created_at DESC'
    );
    
    return NextResponse.json({ classes: result.rows });
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

    const result = await query(
      'INSERT INTO classes (name) VALUES ($1) RETURNING *',
      [name]
    );

    return NextResponse.json({ 
      class: result.rows[0], 
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

/**
 * PUT /api/classes
 * Update an existing class
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الصف مطلوب' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'اسم الصف مطلوب' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE classes SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    return NextResponse.json({ 
      class: result.rows[0], 
      message: SUCCESS_MESSAGES.UPDATED 
    });
  } catch (error) {
    console.error('Error updating class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/classes
 * Delete a class
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف الصف مطلوب' },
        { status: 400 }
      );
    }

    await query('DELETE FROM classes WHERE id = $1', [id]);

    return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    console.error('Error deleting class:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

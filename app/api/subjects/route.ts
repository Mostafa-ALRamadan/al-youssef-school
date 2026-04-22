import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';

/**
 * GET /api/subjects
 * Returns all subjects
 */
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM subjects ORDER BY name ASC'
    );
    
    return NextResponse.json({ subjects: result.rows });
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

    const result = await query(
      'INSERT INTO subjects (name) VALUES ($1) RETURNING *',
      [name]
    );

    return NextResponse.json({ 
      subject: result.rows[0], 
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

/**
 * PUT /api/subjects
 * Update an existing subject
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المادة مطلوب' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { error: 'اسم المادة مطلوب' },
        { status: 400 }
      );
    }

    const result = await query(
      'UPDATE subjects SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    return NextResponse.json({ 
      subject: result.rows[0], 
      message: SUCCESS_MESSAGES.UPDATED 
    });
  } catch (error) {
    console.error('Error updating subject:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/subjects
 * Delete a subject
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المادة مطلوب' },
        { status: 400 }
      );
    }

    await query('DELETE FROM subjects WHERE id = $1', [id]);

    return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    console.error('Error deleting subject:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

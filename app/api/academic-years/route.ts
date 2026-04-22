import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { query } from '@/lib/db';

/**
 * GET /api/academic-years
 * Returns all academic years
 */
export async function GET(request: NextRequest) {
  try {
    const result = await query(
      'SELECT * FROM academic_years ORDER BY start_date DESC'
    );
    
    // Format dates as YYYY-MM-DD strings to avoid timezone issues
    const formatDate = (date: Date | null) => {
      if (!date) return null;
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formattedRows = result.rows.map(row => ({
      ...row,
      start_date: formatDate(row.start_date),
      end_date: formatDate(row.end_date),
    }));
    
    return NextResponse.json({ academicYears: formattedRows });
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

    const result = await query(
      'INSERT INTO academic_years (name, start_date, end_date) VALUES ($1, $2, $3) RETURNING *',
      [name, start_date, end_date]
    );

    return NextResponse.json({ 
      academicYear: result.rows[0], 
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

/**
 * PUT /api/academic-years
 * Update an existing academic year
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, start_date, end_date } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف السنة الدراسية مطلوب' },
        { status: 400 }
      );
    }

    // Build dynamic update query
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (start_date) {
      updates.push(`start_date = $${paramIndex++}`);
      values.push(start_date);
    }
    if (end_date) {
      updates.push(`end_date = $${paramIndex++}`);
      values.push(end_date);
    }

    if (updates.length === 0) {
      return NextResponse.json(
        { error: 'لا توجد حقول للتحديث' },
        { status: 400 }
      );
    }

    values.push(id); // Add id for WHERE clause

    const result = await query(
      `UPDATE academic_years SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    return NextResponse.json({ 
      academicYear: result.rows[0], 
      message: SUCCESS_MESSAGES.UPDATED 
    });
  } catch (error) {
    console.error('Error updating academic year:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/academic-years
 * Delete an academic year
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف السنة الدراسية مطلوب' },
        { status: 400 }
      );
    }

    await query('DELETE FROM academic_years WHERE id = $1', [id]);

    return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    console.error('Error deleting academic year:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

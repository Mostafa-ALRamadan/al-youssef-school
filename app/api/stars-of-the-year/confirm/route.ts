import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

interface TopStudent {
  student_id: string;
  position: 1 | 2 | 3;
}

/**
 * POST /api/stars-of-the-year/confirm
 * Saves the top 3 students for a class and academic year
 * Body: { class_id, academic_year_id, top_students: [{student_id, position}] }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { class_id, academic_year_id, top_students } = body;

    if (!class_id || !academic_year_id || !top_students || !Array.isArray(top_students)) {
      return NextResponse.json(
        { error: 'البيانات غير مكتملة' },
        { status: 400 }
      );
    }

    if (top_students.length > 3) {
      return NextResponse.json(
        { error: 'يمكن اختيار 3 طلاب فقط كنجوم للسنة' },
        { status: 400 }
      );
    }

    await query('BEGIN');

    try {
      // Delete existing top students for this class and year
      await query(
        'DELETE FROM class_top_students WHERE class_id = $1 AND academic_year_id = $2',
        [class_id, academic_year_id]
      );

      // Insert new top students
      const insertedStars = [];
      for (const student of top_students as TopStudent[]) {
        const result = await query(
          `INSERT INTO class_top_students (class_id, student_id, academic_year_id, position)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [class_id, student.student_id, academic_year_id, student.position]
        );
        insertedStars.push(result.rows[0]);
      }

      await query('COMMIT');

      return NextResponse.json({
        message: 'تم حفظ نجوم السنة بنجاح',
        stars: insertedStars,
      });
    } catch (error) {
      await query('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('Error in confirm stars:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

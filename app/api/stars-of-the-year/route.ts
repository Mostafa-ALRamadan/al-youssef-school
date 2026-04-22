import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

/**
 * GET /api/stars-of-the-year
 * Returns the top 3 students (stars of the year) for all classes
 * Query params: academic_year_id (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const academicYearId = searchParams.get('academic_year_id');

    let sql = `
      SELECT 
        cts.id,
        cts.position,
        cts.created_at,
        c.name as class_name,
        s.id as student_id,
        s.name as student_name,
        s.image_url as student_image,
        ay.name as academic_year_name
      FROM class_top_students cts
      JOIN classes c ON cts.class_id = c.id
      JOIN students s ON cts.student_id = s.id
      JOIN academic_years ay ON cts.academic_year_id = ay.id
    `;
    
    const params: any[] = [];
    if (academicYearId) {
      sql += ' WHERE cts.academic_year_id = $1';
      params.push(academicYearId);
    }
    
    sql += ' ORDER BY cts.class_id, cts.position';

    const result = await query(sql, params);
    const stars = result.rows;

    // Transform data for mobile app
    const transformedData = stars?.map((star: any) => ({
      id: star.id,
      class: star.class_name || '',
      student_id: star.student_id,
      student_name: star.student_name || '',
      position: star.position,
      image_url: star.student_image,
      academic_year: star.academic_year_name || '',
    })) || [];

    return NextResponse.json({
      stars: transformedData,
    });
  } catch (error) {
    console.error('Error in stars-of-the-year GET:', error);
    return NextResponse.json(
      { error: 'حدث خطأ غير متوقع' },
      { status: 500 }
    );
  }
}

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

// GET /api/student-evaluations - Get all evaluations or filter by student/class/teacher/semester
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');
    const classId = searchParams.get('class_id');
    const teacherId = searchParams.get('teacher_id');
    const semesterId = searchParams.get('semester_id');

    
    let query = supabase
      .from('student_evaluations')
      .select(`
        *,
        students!inner(name, class_id, classes(name)),
        teachers(name)
      `);

    if (studentId) {
      query = query.eq('student_id', studentId);
    }

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    }

    if (classId) {
      query = query.eq('students.class_id', classId);
    }

    if (semesterId) {
      query = query.eq('semester_id', semesterId);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching evaluations:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Transform data to include student_name, class_name
    const transformedData = data?.map((evaluation: any) => ({
      ...evaluation,
      student_name: evaluation.students?.name,
      teacher_name: evaluation.teachers?.name,
      class_id: evaluation.students?.class_id,
      class_name: evaluation.students?.classes?.name,
    })) || [];

    return NextResponse.json({ evaluations: transformedData });
  } catch (error: any) {
    console.error('GET evaluations error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/student-evaluations - Create new evaluation
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { student_id, teacher_id, behavior_rating, participation_rating, homework_rating, notes } = body;

    // Validate required fields
    if (!student_id || !teacher_id) {
      return NextResponse.json(
        { error: 'student_id and teacher_id are required' },
        { status: 400 }
      );
    }

    // Validate ratings are between 1 and 5
    const ratings = [behavior_rating, participation_rating, homework_rating].filter(r => r !== undefined && r !== null);
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    
    // Get active semester
    const { data: activeSemester } = await supabase
      .from('semesters')
      .select('id')
      .eq('is_active', true)
      .single();

    const { data, error } = await supabase
      .from('student_evaluations')
      .insert({
        student_id,
        teacher_id,
        behavior_rating,
        participation_rating,
        homework_rating,
        notes,
        semester_id: activeSemester?.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating evaluation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evaluation: data }, { status: 201 });
  } catch (error: any) {
    console.error('POST evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/student-evaluations - Update evaluation
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, behavior_rating, participation_rating, homework_rating, notes } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Validate ratings are between 1 and 5
    const ratings = [behavior_rating, participation_rating, homework_rating].filter(r => r !== undefined && r !== null);
    for (const rating of ratings) {
      if (rating < 1 || rating > 5) {
        return NextResponse.json(
          { error: 'Ratings must be between 1 and 5' },
          { status: 400 }
        );
      }
    }

    
    const { data, error } = await supabase
      .from('student_evaluations')
      .update({
        behavior_rating,
        participation_rating,
        homework_rating,
        notes,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating evaluation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ evaluation: data });
  } catch (error: any) {
    console.error('PUT evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE /api/student-evaluations?id=xxx - Delete evaluation
export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    
    const { error } = await supabase
      .from('student_evaluations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting evaluation:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('DELETE evaluation error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

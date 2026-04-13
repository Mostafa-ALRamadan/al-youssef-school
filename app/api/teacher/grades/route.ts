import { NextRequest, NextResponse } from 'next/server';
import { ExamService } from '@/services';
import { supabase } from '@/lib/supabase-server';

// Helper function to get authenticated user from request
async function getAuthUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return user;
}

// GET /api/teacher/grades - Get teacher's exams and grades
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get exams for this teacher
    const exams = await ExamService.getExamsByTeacher(teacher.id);

    return NextResponse.json({ exams });
  } catch (error) {
    console.error('GET /api/teacher/grades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/teacher/grades - Create a new exam
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID
    const { data: teacher } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    const body = await request.json();
    const { class_id, subject_id, name, max_score, exam_date } = body;

    // Validate required fields
    if (!class_id || !subject_id || !name || !max_score || !exam_date) {
      return NextResponse.json(
        { error: 'جميع الحقول مطلوبة' },
        { status: 400 }
      );
    }

    // Validate score is positive
    if (max_score <= 0) {
      return NextResponse.json(
        { error: 'الدرجة العظمى يجب أن تكون أكبر من صفر' },
        { status: 400 }
      );
    }

    const exam = await ExamService.createExam({
      class_id,
      subject_id,
      teacher_id: teacher.id,
      name,
      max_score,
      exam_date,
    });

    if (!exam) {
      return NextResponse.json(
        { error: 'فشل في إنشاء الامتحان' },
        { status: 500 }
      );
    }

    return NextResponse.json({ exam }, { status: 201 });
  } catch (error) {
    console.error('POST /api/teacher/grades error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

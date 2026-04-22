import { NextRequest, NextResponse } from 'next/server';
import { ExamService } from '@/services';
import { getCurrentUser } from '@/lib/auth';
import { query } from '@/lib/db';

// GET /api/teacher/grades - Get teacher's exams and grades
export async function GET(request: NextRequest) {
  try {
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID
    const teacherResult = await query('SELECT id FROM teachers WHERE user_id = $1', [user.userId]);
    const teacher = teacherResult.rows[0];

    if (!teacher) {
      return NextResponse.json({ error: 'Teacher not found' }, { status: 404 });
    }

    // Get exams for this teacher with grades count
    const exams = await ExamService.getExamsByTeacher(teacher.id);

    // Check if each exam has grades
    const examsWithGrades = await Promise.all(
      exams.map(async (exam) => {
        const gradesResult = await query(
          'SELECT COUNT(*) as count FROM grades WHERE exam_id = $1',
          [exam.id]
        );
        return {
          ...exam,
          has_grades: parseInt(gradesResult.rows[0]?.count || '0') > 0,
        };
      })
    );

    return NextResponse.json({ exams: examsWithGrades });
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
    const user = getCurrentUser(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get teacher ID
    const teacherResult = await query('SELECT id FROM teachers WHERE user_id = $1', [user.userId]);
    const teacher = teacherResult.rows[0];

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

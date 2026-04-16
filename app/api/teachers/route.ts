import { NextRequest, NextResponse } from 'next/server';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';
import { createServerSupabaseClient } from '@/lib/supabase-server';

/**
 * GET /api/teachers
 * Returns all teachers with their assigned subject and class info
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    
    // Fetch teachers with their primary subject
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*, subjects!left(name)')
      .order('created_at', { ascending: false });
    
    if (teachersError) {
      console.error('GET teachers error:', teachersError);
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR, details: teachersError.message },
        { status: 500 }
      );
    }

    // Fetch users for email lookup
    const { data: users } = await supabase.from('users').select('id, email');
    const userMap = new Map(users?.map(u => [u.id, u.email]) || []);

    // Fetch teacher_assignments with subject and class names
    const { data: assignments } = await supabase
      .from('teacher_assignments')
      .select('teacher_id, class_id, subject_id, subjects(name), classes(name)');
    
    const assignmentMap = new Map(
      (assignments as any[])?.map(a => [a.teacher_id, a]) || []
    );

    const transformedTeachers = teachers.map((teacher: any) => {
      const assignment = assignmentMap.get(teacher.id);
      const teacherSubjectData = teacher.subjects as { name?: string } | undefined;
      const assignmentSubjectData = assignment?.subjects as { name?: string } | undefined;
      const classData = assignment?.classes as { name?: string } | undefined;
      return {
        ...teacher,
        email: userMap.get(teacher.user_id) || '',
        subject_id: teacher.subject_id || assignment?.subject_id || '',
        subject_name: teacherSubjectData?.name || assignmentSubjectData?.name || '',
        class_id: assignment?.class_id || '',
        class_name: classData?.name || '',
      };
    });
    
    return NextResponse.json({ teachers: transformedTeachers });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * POST /api/teachers
 * Create a new teacher with Supabase Auth user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password, phone, subject_id, class_id } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: 'اسم المعلم والبريد الإلكتروني وكلمة المرور مطلوبة' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth createUser error:', authError);
      return NextResponse.json(
        { error: 'فشل إنشاء حساب المستخدم: ' + authError.message },
        { status: 500 }
      );
    }

    const userId = authData.user.id;

    const { error: userError } = await supabase
      .from('users')
      .insert({ id: userId, email, role: 'teacher' });

    if (userError) {
      console.error('Users insert error:', userError);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'فشل إنشاء المستخدم في قاعدة البيانات' },
        { status: 500 }
      );
    }

    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .insert({
        user_id: userId,
        name,
        phone,
        subject_id: subject_id || null,
      })
      .select()
      .single();

    if (teacherError) {
      console.error('Teacher insert error:', teacherError);
      await supabase.from('users').delete().eq('id', userId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'فشل إنشاء بيانات المعلم' },
        { status: 500 }
      );
    }

    if (subject_id && class_id) {
      const { error: taError } = await supabase
        .from('teacher_assignments')
        .insert({
          class_id,
          subject_id,
          teacher_id: teacher.id,
        });

      if (taError) {
        console.error('Failed to create teacher_assignment:', taError);
      }
    }

    return NextResponse.json({ 
      teacher: { ...teacher, email }, 
      message: SUCCESS_MESSAGES.CREATED 
    });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/teachers
 * Update an existing teacher
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, name, phone, subject_id, class_id } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المعلم مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const updates: { name?: string; phone?: string; subject_id?: string } = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;
    if (subject_id !== undefined) updates.subject_id = subject_id;

    const { data: teacher, error } = await supabase
      .from('teachers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    // Update teacher_assignments if class_id is provided (optional)
    if (class_id) {
      const { data: existing } = await supabase
        .from('teacher_assignments')
        .select('id, subject_id')
        .eq('teacher_id', id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('teacher_assignments')
          .update({ class_id, subject_id: subject_id || existing.subject_id })
          .eq('id', existing.id);
      } else if (subject_id) {
        await supabase
          .from('teacher_assignments')
          .insert({ class_id, subject_id, teacher_id: id });
      }
    }

    return NextResponse.json({ teacher, message: SUCCESS_MESSAGES.UPDATED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/teachers
 * Delete a teacher
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المعلم مطلوب' },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();

    const { data: teacher } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', id)
      .single();

    // Delete all related records first
    await supabase.from('weekly_schedule').delete().eq('teacher_id', id);
    await supabase.from('teacher_assignments').delete().eq('teacher_id', id);
    await supabase.from('subject_content').delete().eq('teacher_id', id);
    await supabase.from('exams').delete().eq('teacher_id', id);
    await supabase.from('student_evaluations').delete().eq('teacher_id', id);

    const { error } = await supabase
      .from('teachers')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
        { status: 500 }
      );
    }

    if (teacher?.user_id) {
      // Delete from public users table
      await supabase.from('users').delete().eq('id', teacher.user_id);
      // Delete from auth
      await supabase.auth.admin.deleteUser(teacher.user_id);
    }

    return NextResponse.json({ message: SUCCESS_MESSAGES.DELETED });
  } catch (error) {
    return NextResponse.json(
      { error: ERROR_MESSAGES.GENERAL.UNKNOWN_ERROR },
      { status: 500 }
    );
  }
}

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
    
    // Fetch teachers
    const { data: teachers, error: teachersError } = await supabase
      .from('teachers')
      .select('*')
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

    // Fetch class_subjects with subject and class names
    const { data: classSubjects } = await supabase
      .from('class_subjects')
      .select('teacher_id, class_id, subject_id, subjects(name), classes(name)');
    
    const csMap = new Map(
      (classSubjects as any[])?.map(cs => [cs.teacher_id, cs]) || []
    );

    const transformedTeachers = teachers.map((teacher: any) => {
      const cs = csMap.get(teacher.id);
      const subjectData = cs?.subjects as { name?: string } | undefined;
      const classData = cs?.classes as { name?: string } | undefined;
      return {
        ...teacher,
        email: userMap.get(teacher.user_id) || '',
        subject_id: cs?.subject_id || '',
        subject_name: subjectData?.name || '',
        class_id: cs?.class_id || '',
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
      const { error: csError } = await supabase
        .from('class_subjects')
        .insert({
          class_id,
          subject_id,
          teacher_id: teacher.id,
        });

      if (csError) {
        console.error('Failed to create class_subjects:', csError);
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

    const updates: { name?: string; phone?: string } = {};
    if (name !== undefined) updates.name = name;
    if (phone !== undefined) updates.phone = phone;

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

    if (subject_id && class_id) {
      const { data: existing } = await supabase
        .from('class_subjects')
        .select('id')
        .eq('teacher_id', id)
        .maybeSingle();

      if (existing) {
        await supabase
          .from('class_subjects')
          .update({ class_id, subject_id })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('class_subjects')
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

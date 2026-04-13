import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-server';

// GET /api/admin/users - Get all users with role-specific details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Fetch users
    let query = supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    const { data: users, error } = await query;

    if (error) {
      console.error('Error fetching users:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Fetch teacher names
    const teacherIds = users?.filter(u => u.role === 'teacher').map(u => u.id) || [];
    const { data: teachers } = await supabase
      .from('teachers')
      .select('user_id, name')
      .in('user_id', teacherIds);
    const teacherMap = new Map(teachers?.map(t => [t.user_id, t.name]) || []);

    // Fetch parent names
    const parentIds = users?.filter(u => u.role === 'parent').map(u => u.id) || [];
    const { data: parents } = await supabase
      .from('parents')
      .select('user_id, name')
      .in('user_id', parentIds);
    const parentMap = new Map(parents?.map(p => [p.user_id, p.name]) || []);

    // Merge names into users
    const usersWithNames = users?.map(user => ({
      ...user,
      full_name: user.full_name || 
                 (user.role === 'teacher' ? teacherMap.get(user.id) : null) ||
                 (user.role === 'parent' ? parentMap.get(user.id) : null),
    })) || [];

    return NextResponse.json({ users: usersWithNames });
  } catch (error: any) {
    console.error('GET users error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST /api/admin/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, role, full_name, phone } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'البريد الإلكتروني وكلمة المرور والدور مطلوبة' },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError) {
      console.error('Auth error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }

    const userId = authData.user.id;

    // 2. Create user record in public.users
    const { data: userRecord, error: userError } = await supabase
      .from('users')
      .insert({
        id: userId,
        email,
        role,
      })
      .select()
      .single();

    if (userError) {
      console.error('User record error:', userError);
      // Rollback auth user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      user: userRecord, 
      message: 'تم إنشاء المستخدم بنجاح' 
    });
  } catch (error: any) {
    console.error('POST user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT /api/admin/users - Update user
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Get current user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify current user is main admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user: currentUser }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is main admin
    const { data: currentProfile } = await supabase
      .from('users')
      .select('is_main_admin, role')
      .eq('id', currentUser.id)
      .single();

    // Get target user info
    const { data: targetUser } = await supabase
      .from('users')
      .select('role, is_main_admin')
      .eq('id', id)
      .single();

    // Hierarchy rules:
    // 1. Only main admin can edit other admins
    // 2. Normal admins cannot edit main admin
    // 3. Anyone can edit teachers/parents
    if (targetUser?.role === 'admin') {
      if (!currentProfile?.is_main_admin) {
        return NextResponse.json(
          { error: 'فقط المدير الرئيسي يمكنه تعديل حسابات المدراء' },
          { status: 403 }
        );
      }
      
      if (targetUser.is_main_admin && currentUser.id !== id) {
        return NextResponse.json(
          { error: 'لا يمكن تعديل حساب المدير الرئيسي' },
          { status: 403 }
        );
      }
    }

    const updates: any = {};
    if (email !== undefined) updates.email = email;

    // Update auth email if changed
    if (email) {
      const { error: updateAuthError } = await supabase.auth.admin.updateUserById(id, {
        email,
      });
      if (updateAuthError) {
        console.error('Auth update error:', updateAuthError);
        return NextResponse.json({ error: updateAuthError.message }, { status: 500 });
      }
    }

    // Update public.users
    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Update error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      user: updatedUser, 
      message: 'تم تحديث المستخدم بنجاح' 
    });
  } catch (error: any) {
    console.error('PUT user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

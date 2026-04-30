import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { createAuthUser, deleteAuthUser, updateAuthUser, getCurrentUser, verifyToken } from '@/lib/auth';

// GET /api/admin/users - Get all users with role-specific details
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');

    // Build the SQL query
    let sql = 'SELECT * FROM users ORDER BY created_at DESC';
    const params: any[] = [];
    
    if (role) {
      sql = 'SELECT * FROM users WHERE role = $1 ORDER BY created_at DESC';
      params.push(role);
    }

    const result = await query(sql, params);
    const users = result.rows;

    // Fetch teacher names
    const teacherIds = users?.filter((u: any) => u.role === 'teacher').map((u: any) => u.id) || [];
    let teacherMap = new Map();
    if (teacherIds.length > 0) {
      const teacherPlaceholders = teacherIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      const teacherResult = await query(
        `SELECT user_id, name FROM teachers WHERE user_id IN (${teacherPlaceholders})`,
        teacherIds
      );
      teacherMap = new Map(teacherResult.rows?.map((t: any) => [t.user_id, t.name]) || []);
    }

    // Fetch parent names
    const parentIds = users?.filter((u: any) => u.role === 'parent').map((u: any) => u.id) || [];
    let parentMap = new Map();
    if (parentIds.length > 0) {
      const parentPlaceholders = parentIds.map((_: any, i: number) => `$${i + 1}`).join(',');
      const parentResult = await query(
        `SELECT user_id, name FROM parents WHERE user_id IN (${parentPlaceholders})`,
        parentIds
      );
      parentMap = new Map(parentResult.rows?.map((p: any) => [p.user_id, p.name]) || []);
    }

    // Merge names into users
    const usersWithNames = users?.map((user: any) => ({
      ...user,
      full_name: user.full_name ||
                 (user.role === 'teacher' ? teacherMap.get(user.id) : null) ||
                 (user.role === 'parent' ? parentMap.get(user.id) : null),
    })) || [];

    // Get all parents as users (they don't have user_id, they are separate auth)
    const parentsResult = await query(`
      SELECT id, name, auth_email as email, phone, address, created_at
      FROM parents
      ORDER BY created_at DESC
    `);
    const parentsAsUsers = parentsResult.rows?.map((p: any) => ({
      id: p.id,
      email: p.email,
      role: 'parent',
      full_name: p.name,
      phone: p.phone,
      address: p.address,
      created_at: p.created_at,
      is_parent_account: true,
    })) || [];

    // Combine regular users with parents
    const allUsers = [...usersWithNames, ...parentsAsUsers];

    return NextResponse.json({ users: allUsers });
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
    const { id: userId, error: createError } = await createAuthUser(email, password, role, full_name);
    
    if (createError) {
      console.error('Auth error:', createError);
      return NextResponse.json({ error: createError.message }, { status: 500 });
    }

    // 2. Get user record
    const userResult = await query('SELECT * FROM users WHERE id = $1', [userId]);
    const userRecord = userResult.rows[0];

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
    const { id, email, is_parent_account } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'معرف المستخدم مطلوب' },
        { status: 400 }
      );
    }

    // Handle parent account updates separately
    if (is_parent_account) {
      const updates: any = {};
      if (email !== undefined) updates.auth_email = email;

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }

      const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
      const values = [id, ...Object.values(updates)];

      const updateResult = await query(
        `UPDATE parents SET ${setClause} WHERE id = $1 RETURNING *`,
        values
      );
      const updatedParent = updateResult.rows[0];

      return NextResponse.json({
        user: {
          id: updatedParent.id,
          email: updatedParent.auth_email,
          role: 'parent',
          full_name: updatedParent.name,
          phone: updatedParent.phone,
          is_parent_account: true,
        },
        message: 'تم تحديث ولي الأمر بنجاح'
      });
    }

    // Get current user from auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify current user is main admin
    const token = authHeader.replace('Bearer ', '');
    const currentUser = getCurrentUser(request);
    
    if (!currentUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if current user is main admin
    const currentProfileResult = await query(
      'SELECT is_main_admin, role FROM users WHERE id = $1',
      [currentUser.userId]
    );
    const currentProfile = currentProfileResult.rows[0];

    // Get target user info
    const targetUserResult = await query(
      'SELECT role, is_main_admin FROM users WHERE id = $1',
      [id]
    );
    const targetUser = targetUserResult.rows[0];

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
      
      if (targetUser.is_main_admin && currentUser.userId !== id) {
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
      const { error: updateAuthError } = await updateAuthUser(id, { email });
      if (updateAuthError) {
        console.error('Auth update error:', updateAuthError);
        return NextResponse.json({ error: updateAuthError.message }, { status: 500 });
      }
    }

    // Update users table
    const setClause = Object.keys(updates).map((key, i) => `${key} = $${i + 2}`).join(', ');
    const values = [id, ...Object.values(updates)];

    const updateResult = await query(
      `UPDATE users SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *`,
      values
    );
    const updatedUser = updateResult.rows[0];

    return NextResponse.json({
      user: updatedUser,
      message: 'تم تحديث المستخدم بنجاح'
    });
  } catch (error: any) {
    console.error('PUT user error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

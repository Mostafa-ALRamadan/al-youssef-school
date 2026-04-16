import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/login
 * Authenticates a user and returns session data
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS },
        { status: 400 }
      );
    }

    // Create admin client for session management
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // First authenticate the user
    const { data: authData, error: authError } = await adminClient.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    // Check if user is admin
    const { data: userData } = await adminClient
      .from('users')
      .select('role')
      .eq('id', authData.user.id)
      .single();
    
    // If admin, check if already logged in on another device
    if (userData?.role === 'admin') {
      // Check if admin already has an active session
      const { data: currentUserData } = await adminClient
        .from('users')
        .select('active_session_id, last_login_at')
        .eq('id', authData.user.id)
        .single();
      
      // If there's an active session recorded and it's recent (within last 30 minutes)
      // consider the admin as already logged in
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      const hasRecentLogin = currentUserData?.last_login_at && 
        new Date(currentUserData.last_login_at) > thirtyMinutesAgo;
      
      if (currentUserData?.active_session_id && hasRecentLogin) {
        // Check if that session is still valid by trying to get user with that session
        // We sign out the current attempt and block login
        await adminClient.auth.admin.signOut(authData.user.id, 'global');
        
        return NextResponse.json(
          { error: 'هذا الحساب قيد الاستخدام على جهاز آخر. يرجى تسجيل الخروج من الجهاز الأول أولاً.' },
          { status: 403 }
        );
      }
      
      // Record this new session as the active one
      const sessionId = `${authData.user.id}_${Date.now()}`;
      
      await adminClient
        .from('users')
        .update({
          active_session_id: sessionId,
          last_login_at: new Date().toISOString()
        })
        .eq('id', authData.user.id);
    }

    // For non-admin users (teachers/parents), allow multiple sessions
    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: authData.user,
      session: authData.session,
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS },
      { status: 401 }
    );
  }
}

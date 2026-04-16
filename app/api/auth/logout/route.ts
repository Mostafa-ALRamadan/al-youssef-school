import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SUCCESS_MESSAGES } from '@/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

/**
 * POST /api/auth/logout
 * Logs out the current user and clears admin session tracking
 */
export async function POST(request: NextRequest) {
  try {
    // Get current user from authorization header
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (token) {
      // Verify token and get user
      const adminClient = createClient(supabaseUrl, supabaseServiceKey);
      const { data: { user } } = await adminClient.auth.getUser(token);
      
      if (user) {
        // Check if user is admin
        const { data: userData } = await adminClient
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        
        // Clear active session tracking for admins
        if (userData?.role === 'admin') {
          await adminClient
            .from('users')
            .update({
              active_session_id: null,
              last_login_at: null
            })
            .eq('id', user.id);
        }
      }
    }

    // Sign out from Supabase
    const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabaseClient.auth.signOut();

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'حدث خطأ أثناء تسجيل الخروج' },
      { status: 500 }
    );
  }
}

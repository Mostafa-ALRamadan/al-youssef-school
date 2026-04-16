import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { StudentRepository } from '@/repositories';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/constants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * POST /api/auth/parent-login
 * Parent authentication using student login_name + parent password
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_login_name, password } = body;

    if (!student_login_name || !password) {
      return NextResponse.json(
        { error: 'اسم الطالب وكلمة المرور مطلوبان' },
        { status: 400 }
      );
    }

    // 1. Find student by login_name
    const student = await StudentRepository.findByLoginName(student_login_name);
    if (!student) {
      return NextResponse.json(
        { error: 'الطالب غير موجود' },
        { status: 401 }
      );
    }

    // 2. Get parent's auth_email from the student data
    const parentAuthEmail = (student as any).parents?.auth_email;
    if (!parentAuthEmail) {
      return NextResponse.json(
        { error: 'ولي الأمر غير موجود' },
        { status: 401 }
      );
    }

    // 3. Login with Supabase using the hidden auth_email
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: parentAuthEmail,
      password,
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS },
        { status: 401 }
      );
    }

    return NextResponse.json({
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      user: data.user,
      session: data.session,
    });
  } catch (error: any) {
    console.error('Parent login error:', error);
    
    // Return specific error message if available
    const errorMessage = error.message || ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS;
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 401 }
    );
  }
}

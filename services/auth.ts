import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export class AuthService {
  static async login(email: string, password: string) {
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;
    return data;
  }

  /**
   * Parent login using student login_name + parent password
   * @param studentLoginName - Student's triple name (e.g., "عمر علي عبده")
   * @param password - Parent's password
   */
  static async parentLogin(studentLoginName: string, password: string) {
    // Call the API endpoint instead of direct repository access
    const response = await fetch('/api/auth/parent-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        student_login_name: studentLoginName,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'فشل تسجيل الدخول');
    }

    return data;
  }

  static async logout() {
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error } = await supabaseClient.auth.signOut();
    if (error) throw error;
  }

  static async getCurrentUser() {
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return null;
    
    // Fetch user details from API
    const response = await fetch('/api/user');
    if (!response.ok) return null;
    return response.json();
  }
}

/**
 * AuthService for client-side authentication
 * Note: Admin/Teacher login now uses API routes directly for single-session enforcement
 */
export class AuthService {
  /**
   * Parent login using student login_name + parent password
   * Used by Flutter/mobile app
   * @param studentLoginName - Student's triple name (e.g., "عمر علي عبده")
   * @param password - Parent's password
   */
  static async parentLogin(studentLoginName: string, password: string) {
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
}

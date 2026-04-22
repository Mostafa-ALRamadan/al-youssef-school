'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { SCHOOL_NAME, ERROR_MESSAGES } from '@/constants';
import { Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useUser } from '@/components/providers/UserProvider';

export function LoginForm() {
  const router = useRouter();
  const { setUserInfo } = useUser();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    setError('');

    try {
      // Call API route for login (enables single-session enforcement for admins)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
        setLoading(false);
        return;
      }

      // Store JWT token in localStorage for API calls
      if (data.token) {
        localStorage.setItem('auth_token', data.token);
      }
      
      // Set user info in context immediately
      if (data.user) {
        setUserInfo({
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: data.user.role,
          is_main_admin: data.user.is_main_admin,
        });
      }
      
      // Get role directly from our JWT API response
      const role = data.user?.role;
      
      // Redirect based on role
      if (role === 'admin') {
        router.push('/admin/dashboard');
      } else if (role === 'teacher') {
        router.push('/teacher/dashboard');
      } else if (role === 'parent') {
        setError('غير مصرح لأولياء الأمور بالدخول لنظام الويب');
        setLoading(false);
      } else {
        setError('ليس لديك صلاحية الوصول - الدور غير محدد');
        setLoading(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setError(ERROR_MESSAGES.AUTH.INVALID_CREDENTIALS);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-dark-blue via-brand-primary-blue to-brand-secondary-blue p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-36 h-36 rounded-xl bg-white flex items-center justify-center mb-4 overflow-hidden shadow-lg border-2 border-brand-primary-blue p-3">
            <Image 
              src="/logo.png" 
              alt={SCHOOL_NAME}
              width={128}
              height={128}
              style={{ width: 'auto', height: 'auto' }}
              className="object-contain max-w-[120px] max-h-[120px]"
              priority
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            {SCHOOL_NAME}
          </CardTitle>
          <CardDescription className="text-gray-500 mt-2">
            نظام إدارة المدرسة
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-right block">
                البريد الإلكتروني
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="example@school.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-right"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-right block">
                كلمة المرور
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="text-right"
              />
            </div>
            {error && (
              <div className="p-3 rounded-lg bg-red-50 text-red-600 text-sm text-center">
                {error}
              </div>
            )}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-primary-blue hover:bg-brand-dark-blue text-white font-semibold py-2.5"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                  جاري تسجيل الدخول...
                </>
              ) : (
                'تسجيل الدخول'
              )}
            </Button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-xs text-gray-400">
              © {new Date().getFullYear()} {SCHOOL_NAME}. جميع الحقوق محفوظة.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

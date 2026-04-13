'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const supabase = createClient();
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          // Get user role to determine dashboard
          const { data: profile } = await supabase
            .from('users')
            .select('role')
            .eq('id', session.user.id)
            .single();
          
          // Redirect based on role
          if (profile?.role === 'admin') {
            router.push('/admin/dashboard');
          } else if (profile?.role === 'teacher' || profile?.role === 'authenticated') {
            router.push('/teacher/dashboard');
          } else {
            // Fallback to login if role is unknown
            setShowLogin(true);
          }
        } else {
          // No session, show login form
          setShowLogin(true);
        }
      } catch (error) {
        console.error('Session check error:', error);
        setShowLogin(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkExistingSession();
  }, [router]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-blue"></div>
      </div>
    );
  }

  if (!showLogin) {
    return null; // Will redirect
  }

  return <LoginForm />;
}

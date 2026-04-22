'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken } from '@/lib/auth-client';
import { LoginForm } from '@/components/auth/LoginForm';

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const token = getToken();
        
        if (token) {
          // Verify token and get user role
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          
          if (response.ok) {
            const { user } = await response.json();
            
            // Redirect based on role
            if (user?.role === 'admin') {
              router.push('/admin/dashboard');
            } else if (user?.role === 'teacher') {
              router.push('/teacher/dashboard');
            } else {
              setShowLogin(true);
            }
          } else {
            setShowLogin(true);
          }
        } else {
          // No token, show login form
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

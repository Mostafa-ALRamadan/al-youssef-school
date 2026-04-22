'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: string[];
  redirectTo?: string;
}

export function RoleGuard({ children, allowedRoles, redirectTo = '/login' }: RoleGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') return;
    
    const checkRole = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
          router.push(redirectTo as any);
          return;
        }

        // Verify token and get user info from server-side API
        // This is more secure than client-side JWT verification
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          localStorage.removeItem('auth_token');
          router.push(redirectTo as any);
          return;
        }

        const { user } = await response.json();

        // Check if user role is allowed
        if (!allowedRoles.includes(user.role)) {
          router.push(redirectTo as any);
          return;
        }

        setIsAuthorized(true);
      } catch (error) {
        console.error('Role check error:', error);
        router.push(redirectTo as any);
      } finally {
        setIsLoading(false);
      }
    };

    checkRole();
  }, [router, pathname, allowedRoles, redirectTo]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-primary-blue"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
}

export default RoleGuard;

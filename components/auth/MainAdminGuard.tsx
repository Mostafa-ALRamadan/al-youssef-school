'use client';

import { useUser } from '@/components/providers/UserProvider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface MainAdminGuardProps {
  children: React.ReactNode;
}

export function MainAdminGuard({ children }: MainAdminGuardProps) {
  const { userInfo, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading && userInfo) {
      // Check if user is main admin
      if (!userInfo.is_main_admin) {
        router.push('/admin/dashboard');
      }
    }
  }, [userInfo, loading, router]);

  // Show nothing while checking or redirecting
  if (loading || !userInfo?.is_main_admin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

'use client';

import { useUser } from '@/components/providers/UserProvider';
import { Shield, GraduationCap } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface UserHeaderProps {
  userRole: 'admin' | 'teacher';
}

export function UserHeader({ userRole }: UserHeaderProps) {
  const { userInfo } = useUser();

  const RoleIcon = userRole === 'admin' ? Shield : GraduationCap;

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-end px-4 lg:px-8">
      {/* Right side */}
      <div className="flex items-center gap-4 mr-auto">
        {/* User Profile */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">
              {userRole === 'admin' ? 'المدير' : (userInfo?.name || userInfo?.email || 'المعلم')}
            </span>
            <span className="text-xs text-gray-500">{userInfo?.email}</span>
          </div>
          <Avatar className="h-9 w-9 border-2 border-brand-primary-blue">
            <AvatarFallback className="bg-brand-primary-blue text-white">
              <RoleIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { SCHOOL_NAME } from '@/constants';
import { useUser } from '@/components/providers/UserProvider';
import { getToken, removeToken } from '@/lib/auth-client';
import Image from 'next/image';
import {
  LayoutDashboard,
  Users,
  UserCog,
  GraduationCap,
  Building,
  BookOpen,
  Megaphone,
  ClipboardCheck,
  Award,
  Calendar,
  CalendarDays,
  MessageSquare,
  Star,
  Trophy,
  Menu,
  LogOut,
  ChevronLeft,
  Newspaper,
  Wallet,
} from 'lucide-react';

const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  UserCog: <UserCog className="h-5 w-5" />,
  GraduationCap: <GraduationCap className="h-5 w-5" />,
  Building: <Building className="h-5 w-5" />,
  BookOpen: <BookOpen className="h-5 w-5" />,
  Megaphone: <Megaphone className="h-5 w-5" />,
  ClipboardCheck: <ClipboardCheck className="h-5 w-5" />,
  Award: <Award className="h-5 w-5" />,
  Calendar: <Calendar className="h-5 w-5" />,
  CalendarDays: <CalendarDays className="h-5 w-5" />,
  MessageSquare: <MessageSquare className="h-5 w-5" />,
  Star: <Star className="h-5 w-5" />,
  Trophy: <Trophy className="h-5 w-5" />,
  Newspaper: <Newspaper className="h-5 w-5" />,
  Wallet: <Wallet className="h-5 w-5" />,
};

interface SidebarItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  requiresMainAdmin?: boolean;
}

interface SidebarProps {
  items: ReadonlyArray<SidebarItem>;
  userRole: 'admin' | 'teacher';
  isMainAdmin?: boolean;
}

export function Sidebar({ items, userRole, isMainAdmin }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { userInfo, clearUser } = useUser();
  const navRef = useRef<HTMLElement>(null);

  // Restore scroll position on mount
  useLayoutEffect(() => {
    const savedScroll = sessionStorage.getItem('sidebar_scroll');
    if (navRef.current && savedScroll) {
      navRef.current.scrollTop = parseInt(savedScroll, 10);
    }
  }, []);

  // Save scroll position on scroll
  const handleScroll = () => {
    if (navRef.current) {
      sessionStorage.setItem('sidebar_scroll', String(navRef.current.scrollTop));
    }
  };

  // Use provided isMainAdmin or get from user context
  const actualIsMainAdmin = isMainAdmin !== undefined ? isMainAdmin : userInfo?.is_main_admin;

  // Filter items based on main admin status
  const visibleItems = items.filter(item => {
    if (item.requiresMainAdmin && !actualIsMainAdmin) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      // Get token for the API call
      const token = getToken();
      
      // Call API to clear session tracking
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        });
      }
      
      // Clear token and scroll position
      removeToken();
      sessionStorage.removeItem('sidebar_scroll');
      
      // Clear user state
      clearUser();
      
      // Redirect to login
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still redirect even if there's an error
      router.push('/login');
    }
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex flex-col h-screen bg-white border-l border-gray-200 transition-all duration-300',
          isCollapsed ? 'w-20' : 'w-64'
        )}
      >
        {/* Logo */}
        <div className="relative flex items-center justify-between h-16 px-4 border-b border-gray-200">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-brand-primary-blue">
                <Image 
                  src="/logo.png" 
                  alt={SCHOOL_NAME}
                  width={28}
                  height={28}
                  style={{ width: 'auto', height: 'auto' }}
                  className="object-contain max-w-[24px] max-h-[24px]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {SCHOOL_NAME}
                </span>
                <span className="text-xs text-gray-500">
                  {userRole === 'admin' ? 'لوحة الإدارة' : 'لوحة المعلم'}
                </span>
              </div>
            </div>
          )}
          {isCollapsed && (
            <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center mx-auto overflow-hidden shadow-sm border border-brand-primary-blue">
              <Image 
                src="/logo.png" 
                alt={SCHOOL_NAME}
                width={28}
                height={28}
                className="object-contain w-auto h-auto max-w-[28px] max-h-[28px]"
              />
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="lg:flex absolute -left-3 top-1/2 -translate-y-1/2 bg-white border border-gray-200 shadow-sm hover:bg-gray-50 z-50"
          >
            <ChevronLeft
              className={cn(
                'h-4 w-4 transition-transform',
                isCollapsed && 'rotate-180'
              )}
            />
          </Button>
        </div>

        {/* Navigation */}
        <nav 
          ref={navRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto py-4 px-2 space-y-1"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#0179cf transparent'
          }}
        >
          {visibleItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.id}
                href={item.href as any}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                  isActive
                    ? 'bg-brand-primary-blue text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  isCollapsed && 'justify-center'
                )}
              >
                {iconMap[item.icon]}
                {!isCollapsed && <span className="font-medium">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="ghost"
            className={cn(
              'w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50',
              isCollapsed && 'justify-center'
            )}
            onClick={handleLogout}
          >
            <LogOut className="h-5 w-5" />
            {!isCollapsed && <span>تسجيل الخروج</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <Sheet open={isMobileOpen} onOpenChange={setIsMobileOpen}>
        <SheetTrigger 
          className="lg:hidden fixed top-4 right-4 z-40 p-2 rounded-md hover:bg-gray-100 cursor-pointer bg-white shadow-sm"
          onClick={() => setIsMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </SheetTrigger>
        <SheetContent side="right" className="w-72 p-0">
          <div className="flex flex-col h-full">
            {/* Logo */}
            <div className="flex items-center gap-2 h-16 px-4 border-b border-gray-200">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden shadow-sm border border-brand-primary-blue">
                <Image 
                  src="/logo.png" 
                  alt={SCHOOL_NAME}
                  width={28}
                  height={28}
                  style={{ width: 'auto', height: 'auto' }}
                  className="object-contain max-w-[24px] max-h-[24px]"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-gray-900 leading-tight">
                  {SCHOOL_NAME}
                </span>
                <span className="text-xs text-gray-500">
                  {userRole === 'admin' ? 'لوحة الإدارة' : 'لوحة المعلم'}
                </span>
              </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
              {visibleItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.id}
                    href={item.href as any}
                    onClick={() => setIsMobileOpen(false)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors',
                      isActive
                        ? 'bg-brand-primary-blue text-white'
                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    {iconMap[item.icon]}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Logout */}
            <div className="p-4 border-t border-gray-200">
              <Button
                variant="ghost"
                className="w-full flex items-center gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>تسجيل الخروج</span>
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

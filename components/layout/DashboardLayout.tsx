import { Sidebar } from './Sidebar';
import { UserHeader } from './UserHeader';

interface DashboardLayoutProps {
  children: React.ReactNode;
  sidebarItems: ReadonlyArray<{ id: string; label: string; icon: string; href: string; requiresMainAdmin?: boolean }>;
  userRole: 'admin' | 'teacher';
  isMainAdmin?: boolean;
}

export function DashboardLayout({
  children,
  sidebarItems,
  userRole,
  isMainAdmin,
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar items={sidebarItems} userRole={userRole} isMainAdmin={isMainAdmin} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <UserHeader userRole={userRole} />
        <main className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

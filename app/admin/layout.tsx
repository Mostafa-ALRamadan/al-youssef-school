import RoleGuard from '@/components/auth/RoleGuard';
import { Toaster } from '@/components/ui/toaster';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['admin']}>
      {children}
      <Toaster />
    </RoleGuard>
  );
}

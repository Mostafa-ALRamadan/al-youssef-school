import { Toaster } from '@/components/ui/toaster';
import RoleGuard from '@/components/auth/RoleGuard';

export default function TeacherLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard allowedRoles={['teacher', 'authenticated']}>
      <div dir="rtl">
        {children}
        <Toaster />
      </div>
    </RoleGuard>
  );
}

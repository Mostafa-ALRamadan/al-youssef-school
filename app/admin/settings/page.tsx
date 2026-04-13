'use client';

import { MainAdminGuard } from '@/components/auth/MainAdminGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { Settings } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <MainAdminGuard>
      <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Settings className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold text-gray-900">إعدادات النظام</h1>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <p className="text-yellow-800">
              هذه الصفحة متاحة فقط للمدير الرئيسي (Main Admin). 
              المدراء العاديون لا يمكنهم الوصول إليها.
            </p>
          </div>

          {/* Add your main-admin-only settings here */}
        </div>
      </DashboardLayout>
    </MainAdminGuard>
  );
}

import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ADMIN_SIDEBAR_ITEMS, SCHOOL_NAME, USER_ROLES } from '@/constants';
import { DashboardService } from '@/services';
import {
  Users,
  GraduationCap,
  Building,
  ClipboardCheck,
  CreditCard,
  MessageSquare,
  Bell,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import { formatNumber } from '@/utils/number';

export const metadata = {
  title: `لوحة التحكم - ${SCHOOL_NAME}`,
  description: 'لوحة تحكم الإدارة',
};

async function getDashboardStats() {
  try {
    return await DashboardService.getDashboardStats();
  } catch {
    return {
      totalStudents: 0,
      totalTeachers: 0,
      totalClasses: 0,
      attendanceRate: 0,
      pendingPayments: 0,
      newSuggestions: 0,
    };
  }
}

export default async function AdminDashboardPage() {
  const stats = await getDashboardStats();

  return (
    <DashboardLayout
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      userRole={USER_ROLES.ADMIN}
    >
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        </div>
        <p className="text-gray-500 mt-1">نظرة عامة على إحصائيات المدرسة</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="إجمالي الطلاب"
          value={formatNumber(stats.totalStudents)}
          icon={<Users className="h-5 w-5" />}
          description="الطلاب النشطين"
        />
        <StatCard
          title="إجمالي المعلمين"
          value={formatNumber(stats.totalTeachers)}
          icon={<GraduationCap className="h-5 w-5" />}
          description="المعلمين النشطين"
        />
        <StatCard
          title="إجمالي الصفوف"
          value={formatNumber(stats.totalClasses)}
          icon={<Building className="h-5 w-5" />}
          description="الصفوف الدراسية"
        />
        <StatCard
          title="نسبة الحضور اليوم"
          value={`${formatNumber(stats.attendanceRate)}%`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          description="حضور اليوم"
          trend="up"
          trendValue={`${formatNumber(2)}%`}
        />
        <StatCard
          title="الأقساط المعلقة"
          value={formatNumber(stats.pendingPayments)}
          icon={<CreditCard className="h-5 w-5" />}
          description="قسط غير مدفوع"
          trend="down"
          trendValue={`${formatNumber(5)}%`}
        />
        <StatCard
          title="اقتراحات جديدة"
          value={formatNumber(stats.newSuggestions)}
          icon={<MessageSquare className="h-5 w-5" />}
          description="بانتظار المراجعة"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Announcements Placeholder */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">آخر الإعلانات</h2>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">عاجل</span>
                <span className="text-sm text-gray-500">اليوم</span>
              </div>
              <p className="font-medium text-gray-900">تأجيل الامتحانات النصفية</p>
              <p className="text-sm text-gray-500 mt-1">تم تأجيل الامتحانات النصفية إلى الأسبوع القادم</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">إعلان</span>
                <span className="text-sm text-gray-500">أمس</span>
              </div>
              <p className="font-medium text-gray-900">اجتماع أولياء الأمور</p>
              <p className="text-sm text-gray-500 mt-1">اجتماع أولياء الأمور يوم السبت القادم الساعة 5 مساءً</p>
            </div>
          </div>
        </div>

        {/* Weekly Schedule Preview */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">البرنامج الأسبوعي</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-brand-primary-blue/10 flex items-center justify-center text-brand-primary-blue font-bold">
                الأحد
              </div>
              <div>
                <p className="font-medium text-gray-900">الفصل الأول - الصف الرابع</p>
                <p className="text-sm text-gray-500">الرياضيات - الأستاذ أحمد</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-brand-primary-blue/10 flex items-center justify-center text-brand-primary-blue font-bold">
                الأحد
              </div>
              <div>
                <p className="font-medium text-gray-900">الفصل الثاني - الصف الخامس</p>
                <p className="text-sm text-gray-500">اللغة العربية - الأستاذة فاطمة</p>
              </div>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
              <div className="w-12 h-12 rounded-lg bg-brand-primary-blue/10 flex items-center justify-center text-brand-primary-blue font-bold">
                الاثنين
              </div>
              <div>
                <p className="font-medium text-gray-900">الفصل الأول - الصف السادس</p>
                <p className="text-sm text-gray-500">العلوم - الأستاذ خالد</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

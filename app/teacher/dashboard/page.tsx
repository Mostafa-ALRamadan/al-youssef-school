import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TEACHER_SIDEBAR_ITEMS, SCHOOL_NAME, USER_ROLES } from '@/constants';
import {
  Users,
  ClipboardCheck,
  Award,
  Calendar,
  BookOpen,
  Clock,
  Bell,
  LayoutDashboard,
} from 'lucide-react';
import { formatNumber } from '@/utils/number';

export const metadata = {
  title: `لوحة المعلم - ${SCHOOL_NAME}`,
  description: 'لوحة تحكم المعلم',
};

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout
      sidebarItems={[...TEACHER_SIDEBAR_ITEMS]}
      userRole={USER_ROLES.TEACHER}
    >
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold text-gray-900">لوحة المعلم</h1>
        </div>
        <p className="text-gray-500 mt-1">نظرة عامة على أنشطتك اليومية</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="طلابي"
          value={formatNumber(32)}
          icon={<Users className="h-5 w-5" />}
          description={`طالب في ${formatNumber(3)} صفوف`}
        />
        <StatCard
          title="الحصص اليوم"
          value={formatNumber(5)}
          icon={<Clock className="h-5 w-5" />}
          description="حصص مجدولة"
        />
        <StatCard
          title="التفقد اليومي"
value={`${formatNumber(98)}%`}
          icon={<ClipboardCheck className="h-5 w-5" />}
          description="نسبة الحضور في حصصك"
          trend="up"
          trendValue={`${formatNumber(3)}%`}
        />
        <StatCard
          title="العلامات المدخلة"
          value={formatNumber(156)}
          icon={<Award className="h-5 w-5" />}
          description="علامة هذا الفصل"
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">جدول اليوم</h2>
            <Calendar className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-3 bg-brand-primary-blue/5 rounded-lg border-r-4 border-brand-primary-blue">
              <div className="text-center">
                <p className="font-bold text-brand-primary-blue">08:00</p>
                <p className="text-xs text-gray-500">ص</p>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">الرياضيات</p>
                <p className="text-sm text-gray-500">الصف الرابع - الفصل 1</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">تم</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border-r-4 border-brand-yellow">
              <div className="text-center">
                <p className="font-bold text-brand-yellow">09:30</p>
                <p className="text-xs text-gray-500">ص</p>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">الرياضيات</p>
                <p className="text-sm text-gray-500">الصف الخامس - الفصل 2</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">الآن</span>
            </div>
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border-r-4 border-gray-300">
              <div className="text-center">
                <p className="font-bold text-gray-500">11:00</p>
                <p className="text-xs text-gray-500">ص</p>
              </div>
              <div className="flex-1">
                <p className="font-medium text-gray-900">الرياضيات</p>
                <p className="text-sm text-gray-500">الصف السادس - الفصل 1</p>
              </div>
              <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">قادم</span>
            </div>
          </div>
        </div>

        {/* Recent Notifications */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">الإشعارات</h2>
            <Bell className="h-5 w-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <div className="p-4 bg-red-50 rounded-lg border-r-4 border-red-500">
              <p className="font-medium text-red-900">تذكير: تسليم علامات الامتحان</p>
              <p className="text-sm text-red-700 mt-1">يرجى تسليم علامات اختبار نهاية الفصل قبل نهاية هذا الأسبوع</p>
              <p className="text-xs text-gray-500 mt-2">منذ ساعتين</p>
            </div>
            <div className="p-4 bg-blue-50 rounded-lg border-r-4 border-blue-500">
              <p className="font-medium text-blue-900">اجتماع المعلمين</p>
              <p className="text-sm text-blue-700 mt-1">اجتماع المعلمين يوم الخميس الساعة 2 ظهراً</p>
              <p className="text-xs text-gray-500 mt-2">أمس</p>
            </div>
            <div className="p-4 bg-gray-50 rounded-lg border-r-4 border-gray-300">
              <p className="font-medium text-gray-900">تحديث منهج الرياضيات</p>
              <p className="text-sm text-gray-600 mt-1">تم إضافة مواد جديدة إلى منهج الصف السادس</p>
              <p className="text-xs text-gray-500 mt-2">منذ 3 أيام</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">إجراءات سريعة</h2>
            <BookOpen className="h-5 w-5 text-gray-400" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button className="p-4 bg-brand-primary-blue/5 hover:bg-brand-primary-blue/10 rounded-xl transition-colors text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-primary-blue/10 flex items-center justify-center group-hover:bg-brand-primary-blue/20">
                <ClipboardCheck className="h-6 w-6 text-brand-primary-blue" />
              </div>
              <p className="font-medium text-gray-900">تفقد الحضور</p>
              <p className="text-sm text-gray-500">تسجيل حضور الطلاب</p>
            </button>
            <button className="p-4 bg-brand-yellow/10 hover:bg-brand-yellow/20 rounded-xl transition-colors text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-yellow/20 flex items-center justify-center group-hover:bg-brand-yellow/30">
                <Award className="h-6 w-6 text-yellow-700" />
              </div>
              <p className="font-medium text-gray-900">إدخال العلامات</p>
              <p className="text-sm text-gray-500">تسجيل درجات الطلاب</p>
            </button>
            <button className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200">
                <Users className="h-6 w-6 text-green-700" />
              </div>
              <p className="font-medium text-gray-900">عرض الطلاب</p>
              <p className="text-sm text-gray-500">قائمة طلابي</p>
            </button>
            <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center group">
              <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
                <Calendar className="h-6 w-6 text-purple-700" />
              </div>
              <p className="font-medium text-gray-900">الجدول الأسبوعي</p>
              <p className="text-sm text-gray-500">عرض الجدول الكامل</p>
            </button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

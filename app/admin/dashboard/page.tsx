'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { ADMIN_SIDEBAR_ITEMS, SCHOOL_NAME } from '@/constants';
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
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Receipt,
  UserPlus,
  Megaphone,
} from 'lucide-react';
import { formatNumber } from '@/utils/number';
import { formatDate, toArabicNumerals } from '@/utils/date';

interface DashboardData {
  totalStudents: number;
  totalTeachers: number;
  totalClasses: number;
  todayPresent: number;
  todayAbsent: number;
  newComplaints: number;
  totalFees?: number;
  totalPaid?: number;
  totalRemaining?: number;
  latestAnnouncement?: any;
  latestPayment?: any;
  latestAttendanceSession?: any;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMainAdmin, setIsMainAdmin] = useState(false);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Get token from localStorage
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        // Get user data from auth endpoint
        const authResponse = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        let mainAdmin = false;
        if (authResponse.ok) {
          const authData = await authResponse.json();
          mainAdmin = authData.user?.is_main_admin || false;
          setIsMainAdmin(mainAdmin);
        }

        // Get dashboard stats
        const response = await fetch('/api/admin/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout
        sidebarItems={ADMIN_SIDEBAR_ITEMS}
        userRole="admin"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">جاري تحميل الإحصائيات...</div>
        </div>
      </DashboardLayout>
    );
  }

  const totalAttendance = stats.todayPresent + stats.todayAbsent;
  const attendanceRate = totalAttendance > 0
    ? Math.round((stats.todayPresent / totalAttendance) * 100)
    : 0;

  return (
    <DashboardLayout
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      userRole="admin"
    >
      {/* Page Title */}
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <LayoutDashboard className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold text-gray-900">لوحة التحكم</h1>
        </div>
        <p className="text-gray-500 mt-1">نظرة عامة على إحصائيات المدرسة</p>
      </div>

      {/* Stats Grid - All Admins */}
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
          title="الحضور اليوم"
          value={formatNumber(stats.todayPresent)}
          icon={<TrendingUp className="h-5 w-5 text-green-600" />}
          description={`نسبة الحضور: ${toArabicNumerals(attendanceRate)}٪`}
          trend="up"
        />
        <StatCard
          title="الغياب اليوم"
          value={formatNumber(stats.todayAbsent)}
          icon={<TrendingDown className="h-5 w-5 text-red-600" />}
          description="عدد الطلاب الغائبين"
          trend="down"
        />
        <StatCard
          title="شكاوى جديدة"
          value={formatNumber(stats.newComplaints)}
          icon={<MessageSquare className="h-5 w-5" />}
          description="بانتظار المراجعة"
        />
      </div>

      {/* Financial Stats - Main Admin Only */}
      {isMainAdmin && stats.totalFees !== undefined && (
        <>
          <h2 className="text-xl font-bold text-gray-900 mb-4">الإحصائيات المالية</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <StatCard
              title="إجمالي الأقساط"
              value={formatNumber(stats.totalFees)}
              icon={<Wallet className="h-5 w-5 text-blue-600" />}
              description="المبلغ الإجمالي المستحق"
            />
            <StatCard
              title="إجمالي المدفوع"
              value={formatNumber(stats.totalPaid || 0)}
              icon={<DollarSign className="h-5 w-5 text-green-600" />}
              description="المبلغ المحصل"
              trend="up"
            />
            <StatCard
              title="إجمالي المتبقي"
              value={formatNumber(stats.totalRemaining || 0)}
              icon={<Receipt className="h-5 w-5 text-orange-600" />}
              description="المبلغ المتبقي للتحصيل"
              trend="down"
            />
          </div>
        </>
      )}

      {/* Recent Activities */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">آخر النشاطات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Latest Announcement */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">آخر إعلان</h3>
            <Megaphone className="h-5 w-5 text-gray-400" />
          </div>
          {stats.latestAnnouncement ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">إعلان</span>
                <span className="text-sm text-gray-500">
                  {formatDate(stats.latestAnnouncement.created_at)}
                </span>
              </div>
              <p className="font-medium text-gray-900 line-clamp-1">{stats.latestAnnouncement.title}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{stats.latestAnnouncement.content}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد إعلانات</p>
          )}
        </div>

        {/* Latest Payment */}
        {isMainAdmin && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">آخر دفعة</h3>
              <CreditCard className="h-5 w-5 text-gray-400" />
            </div>
            {stats.latestPayment ? (
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-500">
                    {formatDate(stats.latestPayment.payment_date || stats.latestPayment.created_at)}
                  </span>
                  <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
                    {formatNumber(stats.latestPayment.amount)} ل.س
                  </span>
                </div>
                <p className="font-medium text-gray-900">
                  {stats.latestPayment.student_name || 'طالب'}
                </p>
                <p className="text-sm text-gray-500 mt-1">تم استلام دفعة جديدة</p>
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">لا توجد دفعات</p>
            )}
          </div>
        )}

        {/* Latest Attendance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">آخر تسجيل حضور</h3>
            <ClipboardCheck className="h-5 w-5 text-gray-400" />
          </div>
          {stats.latestAttendanceSession ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">حضور</span>
                <span className="text-sm text-gray-500">
                  {formatDate(stats.latestAttendanceSession.date)}
                </span>
              </div>
              <p className="font-medium text-gray-900">تم تسجيل الحضور اليومي</p>
              <p className="text-sm text-gray-500 mt-1">
                الحالة: {stats.latestAttendanceSession.status === 'completed' ? 'مكتمل' : 'نشط'}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد جلسات حضور</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { TEACHER_SIDEBAR_ITEMS } from '@/constants';
import {
  Users,
  ClipboardCheck,
  Award,
  Calendar,
  BookOpen,
  Clock,
  FileText,
  LayoutDashboard,
  Megaphone,
  Star,
} from 'lucide-react';
import { formatNumber } from '@/utils/number';
import { formatDate } from '@/utils/date';

interface TeacherDashboardData {
  totalStudents: number;
  totalClasses: number;
  totalSubjects: number;
  todayAttendance: number;
  todaySessions: number;
  latestPost: any;
  latestAttendance: any;
  latestEvaluation: any;
}

export default function TeacherDashboardPage() {
  const [stats, setStats] = useState<TeacherDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await fetch('/api/teacher/dashboard', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data);
        } else {
          const errorData = await response.json();
          console.error('Failed to fetch stats:', errorData);
        }
      } catch (error) {
        console.error('Error fetching teacher dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <DashboardLayout
        sidebarItems={[...TEACHER_SIDEBAR_ITEMS]}
        userRole="teacher"
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-lg text-gray-500">جاري تحميل الإحصائيات...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      sidebarItems={[...TEACHER_SIDEBAR_ITEMS]}
      userRole="teacher"
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
          title="عدد طلابي"
          value={formatNumber(stats.totalStudents)}
          icon={<Users className="h-5 w-5" />}
          description={`طالب في ${formatNumber(stats.totalClasses)} صفوف`}
        />
        <StatCard
          title="عدد الصفوف"
          value={formatNumber(stats.totalClasses)}
          icon={<BookOpen className="h-5 w-5" />}
          description={`عدد المواد: ${formatNumber(stats.totalSubjects)}`}
        />
        <StatCard
          title="عدد المواد"
          value={formatNumber(stats.totalSubjects)}
          icon={<Award className="h-5 w-5" />}
          description="مواد مدرسة"
        />
        <StatCard
          title="عدد الحضور اليوم"
          value={formatNumber(stats.todayAttendance)}
          icon={<ClipboardCheck className="h-5 w-5" />}
          description={`في ${formatNumber(stats.todaySessions)} حصة`}
        />
      </div>

      {/* Recent Activities */}
      <h2 className="text-xl font-bold text-gray-900 mb-4">آخر النشاطات</h2>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Latest Post */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">آخر منشور</h3>
            <Megaphone className="h-5 w-5 text-gray-400" />
          </div>
          {stats.latestPost ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-700 rounded">منشور</span>
                <span className="text-sm text-gray-500">
                  {formatDate(stats.latestPost.created_at)}
                </span>
              </div>
              <p className="font-medium text-gray-900 line-clamp-1">{stats.latestPost.title || 'بدون عنوان'}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{stats.latestPost.content}</p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد منشورات</p>
          )}
        </div>

        {/* Latest Attendance */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">آخر تسجيل حضور</h3>
            <Clock className="h-5 w-5 text-gray-400" />
          </div>
          {stats.latestAttendance ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">حضور</span>
                <span className="text-sm text-gray-500">
                  {formatDate(stats.latestAttendance.date)}
                </span>
              </div>
              <p className="font-medium text-gray-900">{stats.latestAttendance.class_name || 'صف'}</p>
              <p className="text-sm text-gray-500 mt-1">
                {stats.latestAttendance.subject_name || 'مادة'}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                الحالة: {stats.latestAttendance.status === 'completed' ? 'مكتمل' : 'نشط'}
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد جلسات حضور</p>
          )}
        </div>

        {/* Latest Evaluation */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">آخر تقييم</h3>
            <Star className="h-5 w-5 text-gray-400" />
          </div>
          {stats.latestEvaluation ? (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-700 rounded">تقييم</span>
                <span className="text-sm text-gray-500">
                  {formatDate(stats.latestEvaluation.created_at)}
                </span>
              </div>
              <p className="font-medium text-gray-900">{stats.latestEvaluation.student_name || 'طالب'}</p>
              <p className="text-sm text-gray-500 mt-1" dir="rtl">
                {['ضعيف', 'وسط', 'جيد', 'جيد جداً', 'ممتاز'][stats.latestEvaluation.behavior_rating - 1]} سلوك | {['ضعيف', 'متوسط', 'جيد', 'جيد جداً', 'ممتاز'][stats.latestEvaluation.participation_rating - 1]} مشاركة | {['ضعيف', 'متوسط', 'جيد', 'جيد جداً', 'ممتاز'][stats.latestEvaluation.homework_rating - 1]} واجبات
              </p>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">لا توجد تقييمات</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">إجراءات سريعة</h2>
          <Calendar className="h-5 w-5 text-gray-400" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/teacher/attendance" className="p-4 bg-brand-primary-blue/5 hover:bg-brand-primary-blue/10 rounded-xl transition-colors text-center group">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-primary-blue/10 flex items-center justify-center group-hover:bg-brand-primary-blue/20">
              <ClipboardCheck className="h-6 w-6 text-brand-primary-blue" />
            </div>
            <p className="font-medium text-gray-900">تفقد الحضور</p>
            <p className="text-sm text-gray-500">تسجيل حضور الطلاب</p>
          </Link>
          <Link href="/teacher/grades" className="p-4 bg-brand-yellow/10 hover:bg-brand-yellow/20 rounded-xl transition-colors text-center group">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-brand-yellow/20 flex items-center justify-center group-hover:bg-brand-yellow/30">
              <Award className="h-6 w-6 text-yellow-700" />
            </div>
            <p className="font-medium text-gray-900">إدخال العلامات</p>
            <p className="text-sm text-gray-500">تسجيل درجات الطلاب</p>
          </Link>
          <Link href="/teacher/students" className="p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-colors text-center group">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-green-100 flex items-center justify-center group-hover:bg-green-200">
              <Users className="h-6 w-6 text-green-700" />
            </div>
            <p className="font-medium text-gray-900">عرض الطلاب</p>
            <p className="text-sm text-gray-500">قائمة طلابي</p>
          </Link>
          <Link href="/teacher/posts" className="p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-center group">
            <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-purple-100 flex items-center justify-center group-hover:bg-purple-200">
              <FileText className="h-6 w-6 text-purple-700" />
            </div>
            <p className="font-medium text-gray-900">منشور جديد</p>
            <p className="text-sm text-gray-500">إنشاء منشور للطلاب</p>
          </Link>
        </div>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Megaphone, Users, GraduationCap, User } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TEACHER_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import type { Announcement } from '@/types';
import { formatDate } from '@/utils/date';

export default function TeacherAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnnouncements();
  }, []);

  const loadAnnouncements = async () => {
    try {

      const response = await fetch('/api/announcements/teacher', {
        headers: {
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setAnnouncements(data.announcements || []);
      }
    } catch (error) {
      console.error('Error loading announcements:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAudienceIcon = (audience: string) => {
    switch (audience) {
      case 'all': return <Users className="h-5 w-5" />;
      case 'teachers': return <GraduationCap className="h-5 w-5" />;
      default: return <User className="h-5 w-5" />;
    }
  };

  const getAudienceLabel = (audience: string) => {
    switch (audience) {
      case 'all': return 'الجميع';
      case 'teachers': return 'المعلمين';
      case 'parents': return 'أولياء الأمور';
      default: return audience;
    }
  };

  return (
    <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole={USER_ROLES.TEACHER}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Megaphone className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">الإعلانات</h1>
        </div>

        {/* Announcements List */}
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              لا توجد إعلانات
            </div>
          ) : (
            announcements.map((announcement) => (
              <Card key={announcement.id}>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between text-lg">
                    <div className="flex items-center gap-3">
                      {getAudienceIcon(announcement.audience)}
                      <span>{announcement.title}</span>
                    </div>
                    <span className="text-sm text-gray-500 font-normal">
                      {formatDate(announcement.created_at)}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {announcement.content}
                  </p>
                  <div className="mt-4 pt-4 border-t text-sm text-gray-500">
                    <span className="inline-flex items-center gap-1">
                      {getAudienceIcon(announcement.audience)}
                      موجه إلى: {getAudienceLabel(announcement.audience)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

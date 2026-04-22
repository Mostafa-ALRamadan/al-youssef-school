'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TEACHER_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar } from 'lucide-react';
import { formatNumber } from '@/utils/number';
import { formatTime } from '@/utils/date';
import { getAuthHeaders } from '@/lib/auth-client';

interface WeeklySchedule {
  id: string;
  class_id: string;
  subject_id: string;
  teacher_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name?: string;
  subject_name?: string;
  teacher_name?: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: 'الأحد' },
  { value: 1, label: 'الإثنين' },
  { value: 2, label: 'الثلاثاء' },
  { value: 3, label: 'الأربعاء' },
  { value: 4, label: 'الخميس' },
  { value: 5, label: 'الجمعة' },
  { value: 6, label: 'السبت' },
];


export default function TeacherSchedulePage() {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const response = await fetch('/api/teacher/schedule', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSchedules(data.schedules || []);
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  // Group schedules by day
  const schedulesByDay = DAYS_OF_WEEK.map(day => ({
    day,
    schedules: schedules.filter(s => s.day_of_week === day.value),
  }));

  return (
    <DashboardLayout
      sidebarItems={TEACHER_SIDEBAR_ITEMS}
      userRole={USER_ROLES.TEACHER}
    >
      <div className="p-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">البرنامج</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-6">
            {schedulesByDay.map(({ day, schedules }) => (
              <Card key={day.value}>
                <CardHeader>
                  <CardTitle>{day.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {schedules.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      لا توجد حصص
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50">
                          <TableHead className="text-center">وقت البداية</TableHead>
                          <TableHead className="text-center">وقت النهاية</TableHead>
                          <TableHead className="text-center">الصف</TableHead>
                          <TableHead className="text-center">المادة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {schedules.map((schedule) => (
                          <TableRow key={schedule.id}>
                            <TableCell className="text-center">{formatTime(schedule.start_time)}</TableCell>
                            <TableCell className="text-center">{formatTime(schedule.end_time)}</TableCell>
                            <TableCell className="text-center">{schedule.class_name}</TableCell>
                            <TableCell className="text-center">{schedule.subject_name}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

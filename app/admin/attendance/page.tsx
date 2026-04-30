'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Calendar, Users, Search, ClipboardCheck } from 'lucide-react';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { Class, LessonAttendance } from '@/types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import { formatTime } from '@/utils/date';
import { USER_ROLES } from '@/constants';

interface AttendanceRecord {
  id: string;
  student_id: string;
  student_name?: string;
  status: 'present' | 'absent' | 'late' | 'excused';
}

const STATUS_LABELS: Record<string, string> = {
  present: 'حاضر',
  absent: 'غائب',
  late: 'متأخر',
  excused: 'بعذر',
};

const STATUS_COLORS: Record<string, string> = {
  present: 'bg-green-100 text-green-800',
  absent: 'bg-red-100 text-red-800',
  late: 'bg-yellow-100 text-yellow-800',
  excused: 'bg-blue-100 text-blue-800',
};

export default function AdminAttendancePage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [semesters, setSemesters] = useState<{ id: string; name: string; academic_year_name: string }[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  });
  const [lessons, setLessons] = useState<LessonAttendance[]>([]);

  useEffect(() => {
    loadClasses();
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        const semesterList = data.semesters || [];
        setSemesters(semesterList);
        // Auto-select active semester
        const activeSemester = semesterList.find((s: any) => s.is_active);
        if (activeSemester) {
          setSelectedSemester(activeSemester.id);
        }
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفصول الدراسية',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (selectedClass && selectedDate) {
      loadAttendance();
    }
  }, [selectedClass, selectedDate]);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الصفوف',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('class_id', selectedClass);
      params.append('date', selectedDate);
      if (selectedSemester) params.append('semester_id', selectedSemester);

      const response = await fetch(`/api/admin/attendance?${params}`);
      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Error loading attendance:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل بيانات التفقد',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };



  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">التفقد اليومي</h1>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="py-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">اختر الصف</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الفصل الدراسي</label>
                <Select value={selectedSemester || '__all__'} onValueChange={(v) => setSelectedSemester(v === '__all__' ? '' : v)}>
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="جميع الفصول" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">جميع الفصول</SelectItem>
                    {semesters.map((semester) => (
                      <SelectItem key={semester.id} value={semester.id}>
                        {semester.academic_year_name} - {semester.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">التاريخ</label>
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const today = new Date();
                      const year = today.getFullYear();
                      const month = String(today.getMonth() + 1).padStart(2, '0');
                      const day = String(today.getDate()).padStart(2, '0');
                      setSelectedDate(`${year}-${month}-${day}`);
                    }}
                  >
                    اليوم
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {lessons.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(() => {
              const allRecords = lessons.flatMap(l => l.records);
              const stats = {
                present: allRecords.filter(r => r.status === 'present').length,
                absent: allRecords.filter(r => r.status === 'absent').length,
                late: allRecords.filter(r => r.status === 'late').length,
                excused: allRecords.filter(r => r.status === 'excused').length,
              };
              return (
                <>
                  <Card>
                    <CardContent className="py-4">
                      <div className="text-2xl font-bold text-green-600">{formatNumber(stats.present)}</div>
                      <div className="text-sm text-gray-500">حاضر</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4">
                      <div className="text-2xl font-bold text-red-600">{formatNumber(stats.absent)}</div>
                      <div className="text-sm text-gray-500">غائب</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4">
                      <div className="text-2xl font-bold text-yellow-600">{formatNumber(stats.late)}</div>
                      <div className="text-sm text-gray-500">متأخر</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="py-4">
                      <div className="text-2xl font-bold text-blue-600">{formatNumber(stats.excused)}</div>
                      <div className="text-sm text-gray-500">بعذر</div>
                    </CardContent>
                  </Card>
                </>
              );
            })()}
          </div>
        )}

        {/* Attendance by Lesson */}
        {loading ? (
          <Card>
            <CardContent className="py-8">
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-32 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ) : lessons.length === 0 ? (
          <Card>
            <CardContent className="py-8">
              <div className="text-center text-gray-500">
                {selectedClass ? 'لا يوجد سجل تفقد لهذا اليوم' : 'اختر صفاً وتاريخاً لعرض التفقد'}
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => (
              <Card key={lesson.session_id || lesson.schedule_id}>
                <CardHeader className="bg-gray-50">
                  <CardTitle className="flex flex-col gap-2 text-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-brand-primary-blue">{lesson.subject_name}</span>
                      <span className="text-sm text-gray-500 flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      المعلم: {lesson.teacher_name}
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  {lesson.records.length === 0 ? (
                    <div className="text-center py-4 text-gray-400">لا يوجد سجلات تفقد</div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50">
                          <TableHead className="text-center">اسم الطالب</TableHead>
                          <TableHead className="text-center">الحالة</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {lesson.records.map((record: AttendanceRecord) => (
                          <TableRow key={record.id}>
                            <TableCell className="text-center font-medium">{record.student_name}</TableCell>
                            <TableCell className="text-center">
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${STATUS_COLORS[record.status]}`}>
                                {STATUS_LABELS[record.status]}
                              </span>
                            </TableCell>
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

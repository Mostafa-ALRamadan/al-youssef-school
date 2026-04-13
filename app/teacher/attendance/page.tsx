'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Save, Users, Calendar, BookOpen, ClipboardCheck } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TEACHER_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { createClient } from '@/lib/supabase';
import { formatDate, formatTime } from '@/utils/date';

interface Lesson {
  id: string;
  class_id: string;
  subject_id: string;
  class_name: string;
  subject_name: string;
  start_time: string;
  end_time: string;
  session_id?: string;
  has_attendance?: boolean;
}

interface Student {
  id: string;
  name: string;
}

interface AttendanceRecord {
  student_id: string;
  status: 'present' | 'absent' | 'late' | 'excused';
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


export default function TeacherAttendancePage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord['status']>>({});
  const [selectedLesson, setSelectedLesson] = useState<string>('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [today, setToday] = useState<string>('');
  const [todayDayName, setTodayDayName] = useState<string>('');

  useEffect(() => {
    const todayDate = new Date();
    // Use local date instead of ISO date to avoid timezone issues
    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, '0');
    const day = String(todayDate.getDate()).padStart(2, '0');
    setToday(`${year}-${month}-${day}`);
    setTodayDayName(DAYS_OF_WEEK[todayDate.getDay()].label);
    loadLessons();
  }, []);

  
  const loadLessons = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch('/api/teacher/attendance', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setLessons(data.lessons || []);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الدروس',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async (lessonId: string) => {
    try {
      setStudentsLoading(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(`/api/attendance/students?schedule_id=${lessonId}&date=${today}`, {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSessionId(data.session?.id || null);
        setStudents(data.students || []);

        // Initialize attendance map
        const attendanceMap: Record<string, AttendanceRecord['status']> = {};
        data.students.forEach((student: Student) => {
          attendanceMap[student.id] = 'present';
        });

        // Override with existing records
        (data.records || []).forEach((record: { student_id: string; status: AttendanceRecord['status'] }) => {
          attendanceMap[record.student_id] = record.status;
        });

        setAttendance(attendanceMap);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلاب',
        variant: 'destructive',
      });
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleLessonSelect = (lessonId: string) => {
    setSelectedLesson(lessonId);
    loadStudents(lessonId);
  };

  const handleStatusChange = (studentId: string, status: AttendanceRecord['status']) => {
    setAttendance(prev => ({
      ...prev,
      [studentId]: status,
    }));
  };

  const handleSave = async () => {
    if (!sessionId) return;

    try {
      setSaving(true);
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      const records = students.map(student => ({
        student_id: student.id,
        status: attendance[student.id] || 'present',
      }));

      const response = await fetch('/api/attendance/records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          session_id: sessionId,
          records,
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حفظ التفقد',
        });
        // Refresh lessons to show "تم التفقد" status
        loadLessons();
      } else {
        throw new Error('Failed to save attendance');
      }
    } catch (error) {
      console.error('Save error:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ التفقد',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  

  return (
    <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole={USER_ROLES.TEACHER}>
      <div className="p-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <ClipboardCheck className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">التفقد اليومي</h1>
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="space-y-6">
            {/* Date Display */}
            <Card>
              <CardContent className="py-4">
                <p className="text-muted-foreground flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {today ? formatDate(today) : ''} - {todayDayName}
                </p>
              </CardContent>
            </Card>

            {/* Lesson Selection */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  اختر الحصة
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lessons.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    لا توجد حصص لك اليوم
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {lessons.map((lesson) => (
                      <button
                        key={lesson.id}
                        onClick={() => handleLessonSelect(lesson.id)}
                        className={`p-4 rounded-lg border text-right transition-colors ${
                          selectedLesson === lesson.id
                            ? 'bg-brand-primary-blue text-white border-brand-primary-blue'
                            : 'bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="font-medium">{lesson.subject_name}</div>
                        <div className={`text-sm ${selectedLesson === lesson.id ? 'text-blue-100' : 'text-gray-500'}`}>
                          {lesson.class_name}
                        </div>
                        <div className={`text-sm mt-1 ${selectedLesson === lesson.id ? 'text-blue-100' : 'text-gray-400'}`}>
                          {formatTime(lesson.start_time)} - {formatTime(lesson.end_time)}
                        </div>
                        {lesson.has_attendance && (
                          <div className={`text-xs mt-2 ${selectedLesson === lesson.id ? 'text-blue-200' : 'text-green-600'}`}>
                            ✓ تم التفقد
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attendance Table */}
            {selectedLesson && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>تفقد الطلاب</CardTitle>
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-brand-primary-blue hover:bg-blue-700"
              >
                <Save className="h-4 w-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ التفقد'}
              </Button>
            </CardHeader>
            <CardContent>
              {studentsLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  جاري تحميل الطلاب...
                </div>
              ) : students.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا يوجد طلاب في هذا الصف
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center">اسم الطالب</TableHead>
                      <TableHead className="text-center">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-center font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Select
                            value={attendance[student.id] || 'present'}
                            onValueChange={(value) => handleStatusChange(student.id, value as AttendanceRecord['status'])}
                          >
                            <SelectTrigger className="w-32 mx-auto">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="present">حاضر</SelectItem>
                              <SelectItem value="absent">غائب</SelectItem>
                              <SelectItem value="late">متأخر</SelectItem>
                              <SelectItem value="excused">بعذر</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

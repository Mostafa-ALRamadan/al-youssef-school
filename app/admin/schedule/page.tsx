'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChevronLeft, ChevronRight, Trash2, Plus, Calendar } from 'lucide-react';
import { formatNumber } from '@/utils/number';
import { formatTime } from '@/utils/date';

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

interface TimeSlot {
  id: string;
  start_time: string;
  end_time: string;
}

interface Class {
  id: string;
  name: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Teacher {
  id: string;
  name: string;
}

interface TeacherAssignment {
  id: string;
  teacher_id: string;
  teacher_name?: string;
  class_id: string;
  class_name?: string;
  subject_id: string;
  subject_name?: string;
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


export default function AdminSchedulePage() {
  const [schedules, setSchedules] = useState<WeeklySchedule[]>([]);
  const [teacherAssignments, setTeacherAssignments] = useState<TeacherAssignment[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedSchedule, setSelectedSchedule] = useState<WeeklySchedule | null>(null);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [formData, setFormData] = useState({
    teacher_assignment_id: '',
    day_of_week: '0',
    time_slot_id: '',
  });
  const [isAddTimeSlotDialogOpen, setIsAddTimeSlotDialogOpen] = useState(false);
  const [isDeleteTimeSlotDialogOpen, setIsDeleteTimeSlotDialogOpen] = useState(false);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot | null>(null);
  const [timeSlotFormData, setTimeSlotFormData] = useState({
    start_time: '',
    end_time: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [schedulesRes, assignmentsRes, classesRes, timeSlotsRes] = await Promise.all([
        fetch('/api/weekly-schedule', { headers: getAuthHeaders() }),
        fetch('/api/teacher-assignments', { headers: getAuthHeaders() }),
        fetch('/api/classes', { headers: getAuthHeaders() }),
        fetch('/api/time-slots', { headers: getAuthHeaders() }),
      ]);

      const schedulesData = await schedulesRes.json();
      const assignmentsData = await assignmentsRes.json();
      const classesData = await classesRes.json();
      const timeSlotsData = await timeSlotsRes.json();

      if (schedulesRes.ok) setSchedules(schedulesData.schedules || []);
      if (assignmentsRes.ok) setTeacherAssignments(assignmentsData.assignments || []);
      if (classesRes.ok) setClasses(classesData.classes || []);
      if (timeSlotsRes.ok) setTimeSlots(timeSlotsData.timeSlots || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/weekly-schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({
          teacher_assignment_id: '',
          day_of_week: '0',
          time_slot_id: '',
        });
        loadData(false);
      } else {
        const error = await response.json();
        console.error('Error creating schedule:', error);
      }
    } catch (error) {
      console.error('Error creating schedule:', error);
    }
  };

  const handleDeleteClick = (schedule: WeeklySchedule) => {
    setSelectedSchedule(schedule);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedSchedule) return;

    try {
      const response = await fetch(`/api/weekly-schedule/${selectedSchedule.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedSchedule(null);
        loadData(false);
      }
    } catch (error) {
      console.error('Error deleting schedule:', error);
    }
  };

  const handleTimeSlotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/time-slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(timeSlotFormData),
      });

      if (response.ok) {
        setIsAddTimeSlotDialogOpen(false);
        setTimeSlotFormData({
          start_time: '',
          end_time: '',
        });
        loadData(false);
      }
    } catch (error) {
      console.error('Error creating time slot:', error);
    }
  };

  const handleDeleteTimeSlotClick = (timeSlot: TimeSlot) => {
    setSelectedTimeSlot(timeSlot);
    setIsDeleteTimeSlotDialogOpen(true);
  };

  const handleDeleteTimeSlotConfirm = async () => {
    if (!selectedTimeSlot) return;

    try {
      const response = await fetch(`/api/time-slots/${selectedTimeSlot.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setIsDeleteTimeSlotDialogOpen(false);
        setSelectedTimeSlot(null);
        loadData(false);
      }
    } catch (error) {
      console.error('Error deleting time slot:', error);
    }
  };

  const filteredSchedules = selectedClass
    ? schedules.filter(s => s.class_id === selectedClass)
    : schedules;

  return (
    <DashboardLayout
      sidebarItems={ADMIN_SIDEBAR_ITEMS}
      userRole={USER_ROLES.ADMIN}
    >
      <div className="p-6" dir="rtl">
        {/* Page Header */}
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">البرنامج الأسبوعي</h1>
        </div>

        {/* Time Slots Management */}
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>إدارة الفترات الزمنية</CardTitle>
            <Button onClick={() => setIsAddTimeSlotDialogOpen(true)} className="bg-brand-primary-blue hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              إضافة فترة
            </Button>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {timeSlots.length === 0 ? (
                <span className="text-gray-500">لا توجد فترات زمنية</span>
              ) : (
                timeSlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center gap-2 bg-gray-100 px-3 py-2 rounded-md"
                  >
                    <span>{'\u200E'}{formatTime(slot.start_time)} - {formatTime(slot.end_time)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteTimeSlotClick(slot)}
                      className="h-6 w-6 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Class Filter */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>اختر الصف</CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="flex h-10 w-full max-w-xs rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">جميع الصفوف</option>
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {/* Schedules Table */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>جدول الحصص الأسبوعي</CardTitle>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-brand-primary-blue hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              إضافة حصة
            </Button>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center">اليوم</TableHead>
                    <TableHead className="text-center">وقت البداية</TableHead>
                    <TableHead className="text-center">وقت النهاية</TableHead>
                    <TableHead className="text-center">الصف</TableHead>
                    <TableHead className="text-center">المادة</TableHead>
                    <TableHead className="text-center">المعلم</TableHead>
                    <TableHead className="text-center">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredSchedules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        لا يوجد حصص في البرنامج الأسبوعي
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredSchedules.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell className="font-medium text-center">
                          {DAYS_OF_WEEK.find(d => d.value === schedule.day_of_week)?.label}
                        </TableCell>
                        <TableCell className="text-center">{'\u200E'}{formatTime(schedule.start_time)}</TableCell>
                        <TableCell className="text-center">{'\u200E'}{formatTime(schedule.end_time)}</TableCell>
                        <TableCell className="text-center">{schedule.class_name}</TableCell>
                        <TableCell className="text-center">{schedule.subject_name}</TableCell>
                        <TableCell className="text-center">{schedule.teacher_name}</TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteClick(schedule)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Add Time Slot Dialog */}
        <Dialog open={isAddTimeSlotDialogOpen} onOpenChange={setIsAddTimeSlotDialogOpen}>
          <DialogContent className="sm:max-w-[400px] [&>button]:hidden">
            <DialogHeader>
              <DialogTitle className="text-center">إضافة فترة زمنية</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleTimeSlotSubmit} className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">وقت البداية</label>
                  <input
                    type="time"
                    value={timeSlotFormData.start_time}
                    onChange={(e) => setTimeSlotFormData({ ...timeSlotFormData, start_time: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">وقت النهاية</label>
                  <input
                    type="time"
                    value={timeSlotFormData.end_time}
                    onChange={(e) => setTimeSlotFormData({ ...timeSlotFormData, end_time: e.target.value })}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-brand-primary-blue hover:bg-blue-700">
                  إضافة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddTimeSlotDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Time Slot Confirmation Dialog */}
        <AlertDialog open={isDeleteTimeSlotDialogOpen} onOpenChange={setIsDeleteTimeSlotDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد حذف الفترة الزمنية</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه الفترة الزمنية؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel onClick={() => setIsDeleteTimeSlotDialogOpen(false)}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteTimeSlotConfirm} className="bg-red-500 hover:bg-red-600">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Schedule Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
            <DialogHeader>
              <DialogTitle className="text-center">إضافة حصة جديدة</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">اليوم</label>
                <select
                  value={formData.day_of_week}
                  onChange={(e) => setFormData({ ...formData, day_of_week: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  {DAYS_OF_WEEK.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الفترة الزمنية</label>
                <select
                  value={formData.time_slot_id}
                  onChange={(e) => setFormData({ ...formData, time_slot_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">اختر الفترة الزمنية</option>
                  {timeSlots.map((slot) => (
                    <option key={slot.id} value={slot.id}>
                      {'\u200E'}{formatTime(slot.start_time)} - {formatTime(slot.end_time)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المعلم - الصف - المادة</label>
                <select
                  value={formData.teacher_assignment_id}
                  onChange={(e) => setFormData({ ...formData, teacher_assignment_id: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  required
                >
                  <option value="">اختر التعيين</option>
                  {teacherAssignments.map((assignment) => (
                    <option key={assignment.id} value={assignment.id}>
                      {assignment.teacher_name} - {assignment.class_name} - {assignment.subject_name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" className="flex-1 bg-brand-primary-blue hover:bg-blue-700">
                  إضافة
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription>
                هل أنت متأكد من حذف هذه الحصة؟
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-500 hover:bg-red-600">
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Trash2, UserCog } from 'lucide-react';
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
import { Teacher, Class, Subject, TeacherAssignment } from '@/types';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { formatDate } from '@/utils/date';
import { getAuthHeaders } from '@/lib/auth-client';

export default function TeacherAssignmentsPage() {
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<TeacherAssignment | null>(null);
  const [formData, setFormData] = useState({
    teacher_id: '',
    subject_id: '',
    class_id: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);

      const [assignmentsRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        fetch('/api/teacher-assignments', { headers: getAuthHeaders() }),
        fetch('/api/teachers', { headers: getAuthHeaders() }),
        fetch('/api/classes', { headers: getAuthHeaders() }),
        fetch('/api/subjects', { headers: getAuthHeaders() }),
      ]);

      const assignmentsData = await assignmentsRes.json();
      const teachersData = await teachersRes.json();
      const classesData = await classesRes.json();
      const subjectsData = await subjectsRes.json();

      if (assignmentsRes.ok) setAssignments(assignmentsData.assignments || []);
      if (teachersRes.ok) setTeachers(teachersData.teachers || []);
      if (classesRes.ok) setClasses(classesData.classes || []);
      if (subjectsRes.ok) setSubjects(subjectsData.subjects || []);
    } catch (error) {
      console.error('Load data error:', error);
      alert('فشل في تحميل البيانات');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.teacher_id || !formData.subject_id || !formData.class_id) {
      alert('جميع الحقول مطلوبة');
      return;
    }

    try {
      const response = await fetch('/api/teacher-assignments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({ teacher_id: '', subject_id: '', class_id: '' });
        loadData(false);
      }
    } catch (error) {
      console.error('Error adding assignment:', error);
    }
  };

  const handleDeleteClick = (assignment: TeacherAssignment) => {
    setSelectedAssignment(assignment);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedAssignment) return;

    try {
      const response = await fetch(`/api/teacher-assignments/${selectedAssignment.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedAssignment(null);
        loadData(false);
      }
    } catch (error) {
      console.error('Error deleting assignment:', error);
    }
  };

  return (
    <DashboardLayout sidebarItems={[...ADMIN_SIDEBAR_ITEMS]} userRole="admin">
      <div className="p-6" dir="rtl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <UserCog className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">تعيين المعلمين</h1>
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-brand-primary-blue hover:bg-brand-dark-blue"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة تعيين
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center">اسم المعلم</TableHead>
                  <TableHead className="text-center">المادة</TableHead>
                  <TableHead className="text-center">الصف</TableHead>
                  <TableHead className="text-center">تاريخ التعيين</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                      لا توجد تعيينات
                    </TableCell>
                  </TableRow>
                ) : (
                  assignments.map((assignment) => (
                    <TableRow key={assignment.id}>
                      <TableCell className="font-medium text-center">{assignment.teacher_name}</TableCell>
                      <TableCell className="text-center">{assignment.subject_name}</TableCell>
                      <TableCell className="text-center">{assignment.class_name}</TableCell>
                      <TableCell className="text-center">{formatDate(assignment.created_at)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(assignment)}
                            className="text-red-600 hover:text-red-800 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="[&>button]:hidden" dir="rtl">
            <DialogHeader>
              <DialogTitle>إضافة تعيين جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">المعلم</label>
                <select
                  value={formData.teacher_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, teacher_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">اختر المعلم</option>
                  {teachers.map((teacher) => (
                    <option key={teacher.id} value={teacher.id}>
                      {teacher.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">المادة</label>
                <select
                  value={formData.subject_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, subject_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">اختر المادة</option>
                  {subjects.map((subject) => (
                    <option key={subject.id} value={subject.id}>
                      {subject.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">الصف</label>
                <select
                  value={formData.class_id}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setFormData({ ...formData, class_id: e.target.value })
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">اختر الصف</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                  إضافة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl" className="text-right">
                هل أنت متأكد من حذف تعيين &quot;{selectedAssignment?.teacher_name}&quot;؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </DashboardLayout>
  );
}

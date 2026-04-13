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
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { Star, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { StudentEvaluation } from '@/types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

interface Student {
  id: string;
  name: string;
  class_name: string;
}

interface Class {
  id: string;
  name: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف',
  2: 'مقبول',
  3: 'جيد',
  4: 'جيد جداً',
  5: 'ممتاز',
};

const RATING_COLORS: Record<number, string> = {
  1: 'bg-red-500 text-white',
  2: 'bg-orange-500 text-white',
  3: 'bg-yellow-500 text-white',
  4: 'bg-blue-500 text-white',
  5: 'bg-green-500 text-white',
};

const RATING_BADGE_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-green-100 text-green-800',
};

export default function TeacherEvaluationsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedEvaluation, setSelectedEvaluation] = useState<StudentEvaluation | null>(null);
  const [formData, setFormData] = useState({
    behavior_rating: 3,
    participation_rating: 3,
    homework_rating: 3,
    notes: '',
  });
  const [activeSemesterId, setActiveSemesterId] = useState<string>('');

  useEffect(() => {
    loadClasses();
    loadActiveSemester();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadStudents();
      loadEvaluations();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      // Get teacher's assigned classes
      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) return;

      const { data: assignments } = await supabase
        .from('teacher_assignments')
        .select('class_id, classes(id, name)')
        .eq('teacher_id', teacherData.id);

      const uniqueClasses = assignments?.map((a: any) => a.classes) || [];
      setClasses(uniqueClasses);
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadActiveSemester = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        const semesters = data.semesters || [];
        const active = semesters.find((s: any) => s.is_active);
        if (active) {
          setActiveSemesterId(active.id);
        }
      }
    } catch (error) {
      console.error('Error loading active semester:', error);
    }
  };

  const loadStudents = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from('students')
        .select('id, name, classes(name)')
        .eq('class_id', selectedClass)
        .order('name');

      if (error) throw error;

      const studentsData = data?.map((s: any) => ({
        id: s.id,
        name: s.name,
        class_name: s.classes?.name,
      })) || [];

      setStudents(studentsData);
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) return;

      const response = await fetch(`/api/student-evaluations?class_id=${selectedClass}&teacher_id=${teacherData.id}`);
      const data = await response.json();

      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) return;

      const { data: teacherData } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherData) return;

      const url = '/api/student-evaluations';
      const method = isEditMode ? 'PUT' : 'POST';
      const body = isEditMode
        ? { id: selectedEvaluation?.id, ...formData }
        : { student_id: selectedStudent, teacher_id: teacherData.id, semester_id: activeSemesterId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save evaluation');
      }

      toast({
        title: 'تم بنجاح',
        description: isEditMode ? 'تم تحديث التقييم' : 'تم إضافة التقييم',
      });

      setIsDialogOpen(false);
      loadEvaluations();
      resetForm();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ التقييم',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التقييم؟')) return;

    try {
      const response = await fetch(`/api/student-evaluations?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete evaluation');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف التقييم',
      });

      loadEvaluations();
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'فشل في حذف التقييم',
        variant: 'destructive',
      });
    }
  };

  const openAddDialog = (studentId: string) => {
    setSelectedStudent(studentId);
    setIsEditMode(false);
    setSelectedEvaluation(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (evaluation: StudentEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEditMode(true);
    setFormData({
      behavior_rating: evaluation.behavior_rating,
      participation_rating: evaluation.participation_rating,
      homework_rating: evaluation.homework_rating,
      notes: evaluation.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      behavior_rating: 3,
      participation_rating: 3,
      homework_rating: 3,
      notes: '',
    });
  };

  const getExistingEvaluation = (studentId: string) => {
    return evaluations.find(e => e.student_id === studentId);
  };

  return (
    <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole={USER_ROLES.TEACHER}>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">تقييم الطلاب</h1>
        </div>

        {/* Class Selector */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اختر الصف
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={selectedClass} onValueChange={setSelectedClass}>
              <SelectTrigger className="w-full max-w-md">
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
          </CardContent>
        </Card>

        {/* Students Table */}
        {selectedClass && (
          <Card>
            <CardHeader>
              <CardTitle>قائمة الطلاب</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center">الطالب</TableHead>
                      <TableHead className="text-center">السلوك</TableHead>
                      <TableHead className="text-center">المشاركة</TableHead>
                      <TableHead className="text-center">الواجبات</TableHead>
                      <TableHead className="text-center">ملاحظات</TableHead>
                      <TableHead className="text-center">التاريخ</TableHead>
                      <TableHead className="text-center">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => {
                      const evaluation = getExistingEvaluation(student.id);
                      return (
                        <TableRow key={student.id}>
                          <TableCell className="text-center font-medium">{student.name}</TableCell>
                          <TableCell className="text-center">
                            {evaluation ? (
                              <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.behavior_rating]}`}>
                                {RATING_LABELS[evaluation.behavior_rating]}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {evaluation ? (
                              <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.participation_rating]}`}>
                                {RATING_LABELS[evaluation.participation_rating]}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            {evaluation ? (
                              <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.homework_rating]}`}>
                                {RATING_LABELS[evaluation.homework_rating]}
                              </span>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-center max-w-xs truncate">
                            {evaluation?.notes || '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {evaluation ? formatDate(evaluation.created_at) : '-'}
                          </TableCell>
                          <TableCell className="text-center">
                            {evaluation ? (
                              <div className="flex items-center justify-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditDialog(evaluation)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Pencil className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(evaluation.id)}
                                  className="text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => openAddDialog(student.id)}
                                className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                              >
                                <Plus className="h-4 w-4 ml-1" />
                                تقييم
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Evaluation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="[&>button]:hidden max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Behavior Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">السلوك</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.behavior_rating === rating ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, behavior_rating: rating })}
                      className={`flex-1 ${formData.behavior_rating === rating ? RATING_COLORS[rating] : ''}`}
                    >
                      {RATING_LABELS[rating]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Participation Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">المشاركة</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.participation_rating === rating ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, participation_rating: rating })}
                      className={`flex-1 ${formData.participation_rating === rating ? RATING_COLORS[rating] : ''}`}
                    >
                      {RATING_LABELS[rating]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Homework Rating */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">الواجبات</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <Button
                      key={rating}
                      type="button"
                      variant={formData.homework_rating === rating ? 'default' : 'outline'}
                      onClick={() => setFormData({ ...formData, homework_rating: rating })}
                      className={`flex-1 ${formData.homework_rating === rating ? RATING_COLORS[rating] : ''}`}
                    >
                      {RATING_LABELS[rating]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">ملاحظات</label>
                <textarea
                  value={formData.notes}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="أضف ملاحظاتك عن الطالب..."
                  rows={4}
                  className="w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  {isEditMode ? 'تحديث' : 'حفظ'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

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
import { useToast } from '@/components/ui/use-toast';
import { Star, Users, Plus, Pencil, Trash2 } from 'lucide-react';
import { getAuthHeaders } from '@/lib/auth-client';
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

interface Subject {
  id: string;
  name: string;
}

const RATING_LABELS: Record<number, string> = {
  1: 'ضعيف',
  2: 'وسط',
  3: 'جيد',
  4: 'جيد جداً',
  5: 'ممتاز',
};

const RATING_COLORS: Record<number, string> = {
  1: 'bg-red-100 text-red-800',
  2: 'bg-orange-100 text-orange-800',
  3: 'bg-yellow-100 text-yellow-800',
  4: 'bg-blue-100 text-blue-800',
  5: 'bg-green-100 text-green-800',
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
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [evaluationToDelete, setEvaluationToDelete] = useState<string | null>(null);
  const [selectedEvaluation, setSelectedEvaluation] = useState<StudentEvaluation | null>(null);
  const [formData, setFormData] = useState({
    subject_id: '',
    behavior_rating: 3,
    participation_rating: 3,
    homework_rating: 3,
    notes: '',
  });
  const [activeSemesterId, setActiveSemesterId] = useState<string>('');
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filter students based on selected student filter
  const filteredStudents = selectedStudent
    ? students.filter(s => s.id === selectedStudent)
    : students;

  // Pagination logic for students
  const totalPages = Math.ceil(filteredStudents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedStudents = filteredStudents.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedClass, selectedStudent, itemsPerPage]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  useEffect(() => {
    loadClasses();
    loadActiveSemester();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      loadSubjects();
      loadStudents();
      loadEvaluations();
    }
  }, [selectedClass]);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/teacher/classes', {
        headers: getAuthHeaders(),
      });

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
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch(`/api/teacher/classes/${selectedClass}/subjects`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل المواد',
        variant: 'destructive',
      });
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
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الفصول الفعالة',
        variant: 'destructive',
      });
    }
  };

  const loadStudents = async () => {
    try {
      const response = await fetch(`/api/teacher/students?class_id=${selectedClass}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل الطلاب',
        variant: 'destructive',
      });
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/student-evaluations?class_id=${selectedClass}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setEvaluations(data.evaluations || []);
      }
    } catch (error) {
      console.error('Error loading evaluations:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل التقييمات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      const url = '/api/student-evaluations';
      const method = isEditMode ? 'PUT' : 'POST';
      const body = isEditMode
        ? { id: selectedEvaluation?.id, ...formData }
        : { student_id: selectedStudent, semester_id: activeSemesterId, ...formData };

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
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

  const openDeleteDialog = (id: string) => {
    setEvaluationToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!evaluationToDelete) return;

    try {
      const response = await fetch(`/api/student-evaluations?id=${evaluationToDelete}`, {
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
      setIsDeleteDialogOpen(false);
      setEvaluationToDelete(null);
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

  const openAddDialogWithSubject = (studentId: string, subjectId: string) => {
    setSelectedStudent(studentId);
    setIsEditMode(false);
    setSelectedEvaluation(null);
    setFormData({
      subject_id: subjectId,
      behavior_rating: 3,
      participation_rating: 3,
      homework_rating: 3,
      notes: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (evaluation: StudentEvaluation) => {
    setSelectedEvaluation(evaluation);
    setIsEditMode(true);
    setFormData({
      subject_id: (evaluation as any).subject_id || '',
      behavior_rating: evaluation.behavior_rating,
      participation_rating: evaluation.participation_rating,
      homework_rating: evaluation.homework_rating,
      notes: evaluation.notes || '',
    });
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({
      subject_id: '',
      behavior_rating: 3,
      participation_rating: 3,
      homework_rating: 3,
      notes: '',
    });
    setSelectedSubject('');
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
                <>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50">
                        <TableHead className="text-center">الطالب</TableHead>
                        <TableHead className="text-center">المادة</TableHead>
                        <TableHead className="text-center">السلوك</TableHead>
                        <TableHead className="text-center">المشاركة</TableHead>
                        <TableHead className="text-center">الواجبات</TableHead>
                        <TableHead className="text-center">ملاحظات</TableHead>
                        <TableHead className="text-center">التاريخ</TableHead>
                        <TableHead className="text-center">الإجراءات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedStudents.map((student) => {
                        // Get evaluations for this student grouped by subject
                        const studentEvaluations = evaluations.filter(e => e.student_id === student.id);
                        
                        // Show each subject evaluation as a separate row
                        const rows: React.ReactNode[] = [];
                        
                        // Add existing evaluations
                        studentEvaluations.forEach((evaluation, index) => {
                          rows.push(
                            <TableRow key={`${student.id}-${(evaluation as any).subject_id || 'general'}-${index}`}>
                              <TableCell className="text-center font-medium">
                                {index === 0 ? student.name : ''}
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-sm text-gray-600">
                                  {(evaluation as any).subject_name || '-'}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.behavior_rating]}`}>
                                  {RATING_LABELS[evaluation.behavior_rating]}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.participation_rating]}`}>
                                  {RATING_LABELS[evaluation.participation_rating]}
                                </span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className={`px-2 py-1 rounded-full text-sm ${RATING_BADGE_COLORS[evaluation.homework_rating]}`}>
                                  {RATING_LABELS[evaluation.homework_rating]}
                                </span>
                              </TableCell>
                              <TableCell className="text-center max-w-xs truncate">
                                {evaluation.notes || '-'}
                              </TableCell>
                              <TableCell className="text-center">
                                {formatDate(evaluation.created_at)}
                              </TableCell>
                              <TableCell className="text-center">
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
                                    onClick={() => openDeleteDialog(evaluation.id)}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    <Trash2 className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        });
                        
                        // Add a row for subjects not yet evaluated
                        const evaluatedSubjects = new Set(studentEvaluations.map(e => (e as any).subject_id));
                        const unevaluatedSubjects = subjects.filter(s => !evaluatedSubjects.has(s.id));
                        
                        if (unevaluatedSubjects.length > 0) {
                          unevaluatedSubjects.forEach((subject, index) => {
                            rows.push(
                              <TableRow key={`${student.id}-${subject.id}-new-${index}`}>
                                <TableCell className="text-center font-medium">
                                  {studentEvaluations.length === 0 && index === 0 ? student.name : ''}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className="text-sm text-gray-600">{subject.name}</span>
                                </TableCell>
                                <TableCell className="text-center"><span className="text-gray-400">-</span></TableCell>
                                <TableCell className="text-center"><span className="text-gray-400">-</span></TableCell>
                                <TableCell className="text-center"><span className="text-gray-400">-</span></TableCell>
                                <TableCell className="text-center">-</TableCell>
                                <TableCell className="text-center">-</TableCell>
                                <TableCell className="text-center">
                                  <Button
                                    size="sm"
                                    onClick={() => openAddDialogWithSubject(student.id, subject.id)}
                                    className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                                  >
                                    <Plus className="h-4 w-4 ml-1" />
                                    تقييم
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          });
                        }
                        
                        return rows;
                      })}
                    </TableBody>
                  </Table>

                  {/* Pagination */}
                  {students.length > 0 && (
                    <div className="flex items-center justify-between mt-4 px-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>عرض</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => setItemsPerPage(Number(value))}
                        >
                          <SelectTrigger className="w-20 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="10">{formatNumber(10)}</SelectItem>
                            <SelectItem value="25">{formatNumber(25)}</SelectItem>
                            <SelectItem value="50">{formatNumber(50)}</SelectItem>
                          </SelectContent>
                        </Select>
                        <span>من أصل {formatNumber(students.length)} طالب</span>
                      </div>

                      <div className="flex items-center gap-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(1)}
                          disabled={currentPage === 1}
                        >
                          الأولى
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={currentPage === 1}
                        >
                          السابق
                        </Button>
                        <span className="px-3 py-1 text-sm">
                          {formatNumber(currentPage)} \ {formatNumber(totalPages)}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(currentPage + 1)}
                          disabled={currentPage === totalPages}
                        >
                          التالي
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageChange(totalPages)}
                          disabled={currentPage === totalPages}
                        >
                          الأخيرة
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف هذا التقييم نهائياً ولا يمكن استرجاعه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsDeleteDialogOpen(false)}>
                إلغاء
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Evaluation Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="[&>button]:hidden max-w-lg">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? 'تعديل التقييم' : 'إضافة تقييم جديد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 py-4">
              {/* Subject Display */}
              <div>
                <label className="block text-sm font-medium text-gray-900 mb-2">المادة</label>
                <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                  {isEditMode ? (
                    <Select 
                      value={formData.subject_id} 
                      onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                    >
                      <SelectTrigger className="w-full bg-white">
                        <SelectValue placeholder="اختر المادة" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <span className="text-gray-700">
                      {subjects.find(s => s.id === formData.subject_id)?.name || 'غير محدد'}
                    </span>
                  )}
                </div>
              </div>

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

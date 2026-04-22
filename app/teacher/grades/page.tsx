'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { FileText, Save, BookOpen, GraduationCap, Award } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { TEACHER_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import type { Exam, Class, Subject, Student } from '@/types';

export default function TeacherGradesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [grades, setGrades] = useState<Record<string, number>>({});
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Form state for creating exam
  const [formData, setFormData] = useState({
    class_id: '',
    subject_id: '',
    name: '',
    max_score: '',
    exam_date: '',
  });

  useEffect(() => {
    loadExams();
    loadClassesAndSubjects();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teacher/grades', {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setExams(data.exams || []);
      }
    } catch (error) {
      console.error('Error loading exams:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadClassesAndSubjects = async () => {
    try {
      // Load classes
      const classesResponse = await fetch('/api/teacher/classes', {
        headers: getAuthHeaders(),
      });
      if (classesResponse.ok) {
        const classesData = await classesResponse.json();
        setClasses(classesData.classes || []);
      }

      // Load subjects
      const subjectsResponse = await fetch('/api/teacher/subjects', {
        headers: getAuthHeaders(),
      });
      if (subjectsResponse.ok) {
        const subjectsData = await subjectsResponse.json();
        setSubjects(subjectsData.subjects || []);
      }
    } catch (error) {
      console.error('Error loading classes and subjects:', error);
    }
  };

  const loadStudents = async (classId: string) => {
    try {
      const response = await fetch(`/api/teacher/students?class_id=${classId}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (error) {
      console.error('Error loading students:', error);
    }
  };

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.class_id || !formData.subject_id || !formData.name || !formData.max_score || !formData.exam_date) {
      toast({
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/teacher/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          class_id: formData.class_id,
          subject_id: formData.subject_id,
          name: formData.name,
          max_score: parseInt(formData.max_score),
          exam_date: formData.exam_date,
        }),
      });

      if (response.ok) {
        const { exam: newExam } = await response.json();
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء الامتحان بنجاح',
        });
        setIsCreateDialogOpen(false);
        setFormData({
          class_id: '',
          subject_id: '',
          name: '',
          max_score: '',
          exam_date: '',
        });
        loadExams();
        // Auto-select the newly created exam
        if (newExam) {
          handleExamSelect(newExam);
        }
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في إنشاء الامتحان',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating exam:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الامتحان',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleExamSelect = async (exam: Exam) => {
    setSelectedExam(exam);
    setGrades({}); // Reset grades when selecting new exam
    await loadStudents(exam.class_id);

    // Load existing grades for this exam
    try {
      const response = await fetch(`/api/teacher/grades/${exam.id}`, {
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        const data = await response.json();
        const existingGrades: Record<string, number> = {};
        data.exam?.grades?.forEach((grade: any) => {
          existingGrades[grade.student_id] = grade.score;
        });
        setGrades(existingGrades); // Only set grades for this exam
      }
    } catch (error) {
      console.error('Error loading grades:', error);
    }
  };

  const handleGradeChange = (studentId: string, score: number) => {
    if (selectedExam && score > selectedExam.max_score) {
      toast({
        title: 'تنبيه',
        description: `الدرجة يجب ألا تتجاوز ${selectedExam.max_score}`,
        variant: 'destructive',
      });
      return;
    }

    setGrades(prev => ({
      ...prev,
      [studentId]: score,
    }));
  };

  const handleSaveGrades = async () => {
    if (!selectedExam) return;

    try {
      setSaving(true);
      const gradesArray = Object.entries(grades).map(([student_id, score]) => ({
        student_id,
        score,
      }));

      const response = await fetch(`/api/teacher/grades/${selectedExam.id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ grades: gradesArray }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حفظ الدرجات بنجاح',
        });
        // Refresh exams to show "تم إدخال الدرجات" status
        loadExams();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في حفظ الدرجات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving grades:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حفظ الدرجات',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole={USER_ROLES.TEACHER}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Award className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">العلامات</h1>
          </div>

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-brand-primary-blue hover:bg-blue-700"
            >
              إنشاء امتحان جديد
            </Button>
            <DialogContent dir="rtl" className="[&>button]:hidden">
              <DialogHeader>
                <DialogTitle>إنشاء امتحان جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateExam} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الصف</Label>
                  <Select
                    value={formData.class_id}
                    onValueChange={(value) => setFormData({ ...formData, class_id: value })}
                  >
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

                <div className="space-y-2">
                  <Label>المادة</Label>
                  <Select
                    value={formData.subject_id}
                    onValueChange={(value) => setFormData({ ...formData, subject_id: value })}
                  >
                    <SelectTrigger dir="rtl">
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
                </div>

                <div className="space-y-2">
                  <Label>اسم الاختبار</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: اختبار نصف الفصل"
                  />
                </div>

                <div className="space-y-2">
                  <Label>الدرجة العظمى</Label>
                  <Input
                    type="number"
                    value={formData.max_score}
                    onChange={(e) => setFormData({ ...formData, max_score: e.target.value })}
                    placeholder="مثال: 100"
                  />
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الاختبار</Label>
                  <Input
                    type="date"
                    value={formData.exam_date}
                    onChange={(e) => setFormData({ ...formData, exam_date: e.target.value })}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                    className="flex-1"
                  >
                    إلغاء
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="flex-1 bg-brand-primary-blue hover:bg-blue-700"
                  >
                    {saving ? 'جاري الإنشاء...' : 'إنشاء الامتحان'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Exams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              الامتحانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : exams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد امتحانات. قم بإنشاء امتحان جديد.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {exams.map((exam) => (
                  <button
                    key={exam.id}
                    onClick={() => handleExamSelect(exam)}
                    className={`p-4 rounded-lg border text-right transition-colors ${
                      selectedExam?.id === exam.id
                        ? 'bg-brand-primary-blue text-white border-brand-primary-blue'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="font-bold">{exam.name}</div>
                    <div className="text-sm mt-1 opacity-90">
                      {(exam as any).class_name || exam.class_id} - {(exam as any).subject_name || exam.subject_id}
                    </div>
                    <div className="text-sm mt-1 opacity-75">
                      الدرجة العظمى: {formatNumber(exam.max_score)}
                    </div>
                    <div className="text-sm mt-1 opacity-75">
                      التاريخ: {formatDate(exam.exam_date)}
                    </div>
                    {(exam as any).has_grades && (
                      <div className={`text-xs mt-2 ${selectedExam?.id === exam.id ? 'text-blue-200' : 'text-green-600'}`}>
                        ✓ تم إدخال الدرجات
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Grades Entry Table */}
        {selectedExam && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                إدخال الدرجات - {selectedExam.name}
              </CardTitle>
              <Button
                onClick={handleSaveGrades}
                disabled={saving}
                className="bg-brand-primary-blue hover:bg-blue-700"
              >
                <Save className="h-4 w-4 ml-2" />
                {saving ? 'جاري الحفظ...' : 'حفظ الدرجات'}
              </Button>
            </CardHeader>
            <CardContent>
              {students.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا يوجد طلاب في هذا الصف
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50">
                      <TableHead className="text-center">اسم الطالب</TableHead>
                      <TableHead className="text-center">
                        الدرجة (من {formatNumber(selectedExam.max_score)})
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="text-center font-medium">{student.name}</TableCell>
                        <TableCell className="text-center">
                          <Input
                            type="number"
                            min="0"
                            max={selectedExam.max_score}
                            value={grades[student.id] || 0}
                            onChange={(e) => handleGradeChange(student.id, parseInt(e.target.value) || 0)}
                            className="w-24 mx-auto text-center"
                          />
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
    </DashboardLayout>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { createClient } from '@/lib/supabase';
import { USER_ROLES } from '@/constants';
import { formatDate } from '@/utils/date';
import { formatNumber, formatDecimal, formatPercentage, formatFraction, toArabicNumerals } from '@/utils/number';
import { Award, FileText, Trash2, Users, Eye, Search } from 'lucide-react';
import type { Exam, Class, Subject } from '@/types';

// Grade categories based on percentage
const getGradeCategory = (score: number, maxScore: number): { label: string; color: string } => {
  const percentage = (score / maxScore) * 100;

  if (percentage >= 90) {
    return { label: 'ممتاز', color: 'bg-green-100 text-green-800' };
  } else if (percentage >= 75) {
    return { label: 'جيد جداً', color: 'bg-blue-100 text-blue-800' };
  } else if (percentage >= 60) {
    return { label: 'جيد', color: 'bg-yellow-100 text-yellow-800' };
  } else if (percentage >= 40) {
    return { label: 'وسط', color: 'bg-orange-100 text-orange-800' };
  } else {
    return { label: 'ضعيف', color: 'bg-red-100 text-red-800' };
  }
};

export default function AdminGradesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [semesters, setSemesters] = useState<{ id: string; name: string; academic_year_name: string }[]>([]);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examGrades, setExamGrades] = useState<any[]>([]);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Filters
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    loadExams();
    loadFilters();
  }, []);

  const loadExams = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass) params.append('class_id', selectedClass);
      if (selectedSubject) params.append('subject_id', selectedSubject);
      if (selectedSemester) params.append('semester_id', selectedSemester);

      const response = await fetch(`/api/admin/grades?${params}`);
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

  const loadFilters = async () => {
    try {
      const [classesRes, subjectsRes, semestersRes] = await Promise.all([
        fetch('/api/classes'),
        fetch('/api/subjects'),
        fetch('/api/semesters'),
      ]);

      if (classesRes.ok) {
        const data = await classesRes.json();
        setClasses(data.classes || []);
      }
      if (subjectsRes.ok) {
        const data = await subjectsRes.json();
        setSubjects(data.subjects || []);
      }
      if (semestersRes.ok) {
        const data = await semestersRes.json();
        const semesterList = data.semesters || [];
        setSemesters(semesterList);
        // Auto-select active semester
        const activeSemester = semesterList.find((s: any) => s.is_active);
        if (activeSemester) {
          setSelectedSemester(activeSemester.id);
        }
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const handleViewDetails = async (exam: Exam) => {
    try {
      const response = await fetch(`/api/admin/grades/${exam.id}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedExam(data.exam);
        setExamGrades(data.exam.grades || []);
        setIsDetailsOpen(true);
      }
    } catch (error) {
      console.error('Error loading exam details:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل تفاصيل الامتحان',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الامتحان؟ سيتم حذف جميع الدرجات المرتبطة به.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/grades/${examId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الامتحان بنجاح',
        });
        loadExams();
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في حذف الامتحان',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting exam:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الامتحان',
        variant: 'destructive',
      });
    }
  };

  // Filter exams by search query
  const filteredExams = exams.filter(exam => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      exam.name.toLowerCase().includes(query) ||
      (exam as any).class_name?.toLowerCase().includes(query) ||
      (exam as any).subject_name?.toLowerCase().includes(query) ||
      (exam as any).teacher_name?.toLowerCase().includes(query)
    );
  });

  // Calculate statistics for selected exam
  const calculateStats = () => {
    if (!examGrades.length) return null;

    const scores = examGrades.map(g => g.score);
    const maxScore = selectedExam?.max_score || 1;
    const avgScore = scores.reduce((a, b) => a + b, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Calculate category distribution
    const categories = {
      excellent: scores.filter(s => getGradeCategory(s, maxScore).label === 'ممتاز').length,
      veryGood: scores.filter(s => getGradeCategory(s, maxScore).label === 'جيد جداً').length,
      good: scores.filter(s => getGradeCategory(s, maxScore).label === 'جيد').length,
      average: scores.filter(s => getGradeCategory(s, maxScore).label === 'وسط').length,
      weak: scores.filter(s => getGradeCategory(s, maxScore).label === 'ضعيف').length,
    };

    return {
      avgScore,
      highestScore,
      lowestScore,
      totalCount: scores.length,
      categories,
    };
  };

  const stats = calculateStats();

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <Award className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">إدارة العلامات</h1>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الصف</label>
                <Select value={selectedClass || '__all__'} onValueChange={(v) => setSelectedClass(v === '__all__' ? '' : v)}>
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="جميع الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">جميع الصفوف</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">المادة</label>
                <Select value={selectedSubject || '__all__'} onValueChange={(v) => setSelectedSubject(v === '__all__' ? '' : v)}>
                  <SelectTrigger dir="rtl">
                    <SelectValue placeholder="جميع المواد" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">جميع المواد</SelectItem>
                    {subjects.map((subject) => (
                      <SelectItem key={subject.id} value={subject.id}>
                        {subject.name}
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">بحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="بحث في الامتحانات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>

              <div className="flex items-end">
                <Button onClick={loadExams} className="w-full bg-brand-primary-blue hover:bg-blue-700">
                  تطبيق الفلتر
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Exams List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              قائمة الامتحانات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-gray-500">جاري التحميل...</div>
            ) : filteredExams.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد امتحانات مطابقة للبحث
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExams.map((exam) => (
                  <Card key={exam.id} className="overflow-hidden">
                    <CardHeader className="bg-gray-50 pb-3">
                      <CardTitle className="text-lg">{exam.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">الصف:</span>
                          <span className="font-medium">{(exam as any).class_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">المادة:</span>
                          <span className="font-medium">{(exam as any).subject_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">المعلم:</span>
                          <span className="font-medium">{(exam as any).teacher_name || '-'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">الدرجة العظمى:</span>
                          <span className="font-medium">{formatNumber(exam.max_score)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">التاريخ:</span>
                          <span className="font-medium">{formatDate(exam.exam_date)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">الفصل الدراسي:</span>
                          <span className="font-medium">{(exam as any).semester_name || '-'}</span>
                        </div>
                      </div>

                      <div className="flex gap-2 mt-4 pt-4 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(exam)}
                          className="flex-1"
                        >
                          <Eye className="h-4 w-4 ml-1" />
                          عرض التفاصيل
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteExam(exam.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Exam Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="!max-w-5xl max-h-[85vh] overflow-y-auto" showCloseButton={false}>
            <DialogHeader>
              <DialogTitle className="text-xl">
                تفاصيل الامتحان: {selectedExam?.name}
              </DialogTitle>
            </DialogHeader>

            {selectedExam && (
              <div className="space-y-6 mt-4">
                {/* Exam Info */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block">الصف</span>
                    <span className="font-medium">{(selectedExam as any).class_name || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block">المادة</span>
                    <span className="font-medium">{(selectedExam as any).subject_name || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block">المعلم</span>
                    <span className="font-medium">{(selectedExam as any).teacher_name || '-'}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block">الدرجة العظمى</span>
                    <span className="font-medium">{formatNumber(selectedExam.max_score)}</span>
                  </div>
                  <div className="bg-gray-50 p-3 rounded">
                    <span className="text-gray-500 block">الفصل الدراسي</span>
                    <span className="font-medium">
                      {examGrades.length > 0 && examGrades[0].semester_name && examGrades[0].semester_name !== '-' ? (
                        `${toArabicNumerals(examGrades[0].academic_year_name)} - ${examGrades[0].semester_name}`
                      ) : (
                        '-'
                      )}
                    </span>
                  </div>
                </div>

                {/* Statistics */}
                {stats && (
                  <div className="space-y-4">
                    {/* Basic Stats */}
                    <div className="grid grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="py-4 text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {formatDecimal(stats.avgScore, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                          </div>
                          <div className="text-sm text-gray-500">المتوسط</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-4 text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {formatNumber(stats.highestScore)}
                          </div>
                          <div className="text-sm text-gray-500">الأعلى</div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="py-4 text-center">
                          <div className="text-2xl font-bold text-red-600">
                            {formatNumber(stats.lowestScore)}
                          </div>
                          <div className="text-sm text-gray-500">الأدنى</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Category Distribution */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">توزيع التقديرات</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-5 gap-2 text-center">
                          <div className="bg-green-50 p-2 rounded">
                            <div className="text-xl font-bold text-green-700">{stats.categories.excellent}</div>
                            <div className="text-xs text-green-600">ممتاز</div>
                          </div>
                          <div className="bg-blue-50 p-2 rounded">
                            <div className="text-xl font-bold text-blue-700">{stats.categories.veryGood}</div>
                            <div className="text-xs text-blue-600">جيد جداً</div>
                          </div>
                          <div className="bg-yellow-50 p-2 rounded">
                            <div className="text-xl font-bold text-yellow-700">{stats.categories.good}</div>
                            <div className="text-xs text-yellow-600">جيد</div>
                          </div>
                          <div className="bg-orange-50 p-2 rounded">
                            <div className="text-xl font-bold text-orange-700">{stats.categories.average}</div>
                            <div className="text-xs text-orange-600">وسط</div>
                          </div>
                          <div className="bg-red-50 p-2 rounded">
                            <div className="text-xl font-bold text-red-700">{stats.categories.weak}</div>
                            <div className="text-xs text-red-600">ضعيف</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Grades Table */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      درجات الطلاب
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {examGrades.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        لا توجد درجات مسجلة لهذا الامتحان
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gray-50">
                            <TableHead className="text-center w-[30%]">اسم الطالب</TableHead>
                            <TableHead className="text-center w-[25%]">الدرجة</TableHead>
                            <TableHead className="text-center w-[25%]">التقدير</TableHead>
                            <TableHead className="text-center w-[20%]">النسبة</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {examGrades.map((grade) => {
                            const percentage = (grade.score / (selectedExam?.max_score || 1)) * 100;
                            const category = getGradeCategory(grade.score, selectedExam?.max_score || 1);
                            return (
                              <TableRow key={grade.id}>
                                <TableCell className="text-center font-medium">
                                  {grade.student_name || grade.student_id}
                                </TableCell>
                                <TableCell className="text-center">
                                  {formatFraction(grade.score, selectedExam?.max_score || 0)}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`px-2 py-1 rounded-full text-sm ${category.color}`}>
                                    {category.label}
                                  </span>
                                </TableCell>
                                <TableCell className="text-center">
                                  {formatPercentage(percentage)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

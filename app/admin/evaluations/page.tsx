'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Star, Users, Search, Trash2, Filter, Pencil } from 'lucide-react';
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

interface Teacher {
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

export default function AdminEvaluationsPage() {
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [semesters, setSemesters] = useState<{ id: string; name: string; academic_year_name: string }[]>([]);
  const [evaluations, setEvaluations] = useState<StudentEvaluation[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedSemester, setSelectedSemester] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  // Track if initial semester load is complete to prevent premature evaluation loading
  const [isSemesterLoaded, setIsSemesterLoaded] = useState(false);

  useEffect(() => {
    loadClasses();
    loadTeachers();
    loadSubjects();
    loadSemesters();
  }, []);

  const loadSemesters = async () => {
    try {
      const response = await fetch('/api/semesters');
      if (response.ok) {
        const data = await response.json();
        const semesterList = data.semesters || [];
        setSemesters(semesterList);
        // Auto-select active semester and mark as loaded
        const activeSemester = semesterList.find((s: any) => s.is_active);
        if (activeSemester) {
          setSelectedSemester(activeSemester.id);
        }
        // Mark semester loading as complete after setting the value
        setTimeout(() => setIsSemesterLoaded(true), 0);
      }
    } catch (error) {
      console.error('Error loading semesters:', error);
      setIsSemesterLoaded(true);
    }
  };

  useEffect(() => {
    // Load evaluations after semester init (empty string means all semesters)
    if (isSemesterLoaded) {
      loadEvaluations();
    }
  }, [selectedClass, selectedTeacher, selectedSubject, selectedSemester, isSemesterLoaded]);

  const loadClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error loading classes:', error);
    }
  };

  const loadTeachers = async () => {
    try {
      const response = await fetch('/api/teachers');
      if (response.ok) {
        const data = await response.json();
        setTeachers(data.teachers || []);
      }
    } catch (error) {
      console.error('Error loading teachers:', error);
    }
  };

  const loadSubjects = async () => {
    try {
      const response = await fetch('/api/subjects');
      if (response.ok) {
        const data = await response.json();
        setSubjects(data.subjects || []);
      }
    } catch (error) {
      console.error('Error loading subjects:', error);
    }
  };

  const loadEvaluations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedClass && selectedClass !== '__all__') params.append('class_id', selectedClass);
      if (selectedTeacher && selectedTeacher !== '__all__') params.append('teacher_id', selectedTeacher);
      if (selectedSubject && selectedSubject !== '__all__') params.append('subject_id', selectedSubject);
      if (selectedSemester) params.append('semester_id', selectedSemester);

      const response = await fetch(`/api/student-evaluations?${params.toString()}`);
      const data = await response.json();

      setEvaluations(data.evaluations || []);
    } catch (error) {
      console.error('Error loading evaluations:', error);
    } finally {
      setLoading(false);
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

      loadEvaluations();
    } catch (error) {
      console.error('Error deleting evaluation:', error);
    }
  };

  const filteredEvaluations = evaluations.filter((evaluation) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      evaluation.student_name?.toLowerCase().includes(query) ||
      evaluation.teacher_name?.toLowerCase().includes(query) ||
      evaluation.class_name?.toLowerCase().includes(query)
    );
  });

  // Calculate statistics
  const stats = {
    total: evaluations.length,
    avgBehavior: evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.behavior_rating, 0) / evaluations.length
      : 0,
    avgParticipation: evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.participation_rating, 0) / evaluations.length
      : 0,
    avgHomework: evaluations.length > 0
      ? evaluations.reduce((sum, e) => sum + e.homework_rating, 0) / evaluations.length
      : 0,
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">تقييم الطلاب</h1>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-brand-primary-blue">
                {formatNumber(stats.total)}
              </div>
              <div className="text-sm text-gray-500">إجمالي التقييمات</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {formatNumber(stats.avgBehavior.toFixed(1))}
              </div>
              <div className="text-sm text-gray-500">متوسط السلوك</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatNumber(stats.avgParticipation.toFixed(1))}
              </div>
              <div className="text-sm text-gray-500">متوسط المشاركة</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {formatNumber(stats.avgHomework.toFixed(1))}
              </div>
              <div className="text-sm text-gray-500">متوسط الواجبات</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              الفلاتر
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">الصف</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
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
                <label className="block text-sm font-medium mb-2">الفصل الدراسي</label>
                <Select value={selectedSemester || '__all__'} onValueChange={(v) => setSelectedSemester(v === '__all__' ? '' : v)}>
                  <SelectTrigger>
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
                <label className="block text-sm font-medium mb-2">المادة</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                  <SelectTrigger>
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
                <label className="block text-sm font-medium mb-2">المعلم</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                  <SelectTrigger>
                    <SelectValue placeholder="جميع المعلمين" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__all__">جميع المعلمين</SelectItem>
                    {teachers.map((teacher) => (
                      <SelectItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">بحث</label>
                <div className="relative">
                  <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="ابحث عن طالب أو معلم..."
                    value={searchQuery}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Evaluations Table */}
        <Card>
          <CardHeader>
            <CardTitle>قائمة التقييمات</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">جاري التحميل...</div>
            ) : filteredEvaluations.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                لا توجد تقييمات
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-50">
                    <TableHead className="text-center">الطالب</TableHead>
                    <TableHead className="text-center">الصف</TableHead>
                    <TableHead className="text-center">المعلم</TableHead>
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
                  {filteredEvaluations.map((evaluation) => (
                    <TableRow key={evaluation.id}>
                      <TableCell className="text-center font-medium">
                        {evaluation.student_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.class_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {evaluation.teacher_name}
                      </TableCell>
                      <TableCell className="text-center">
                        {(evaluation as any).subject_name || '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-sm ${RATING_COLORS[evaluation.behavior_rating]}`}>
                          {RATING_LABELS[evaluation.behavior_rating]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-sm ${RATING_COLORS[evaluation.participation_rating]}`}>
                          {RATING_LABELS[evaluation.participation_rating]}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-sm ${RATING_COLORS[evaluation.homework_rating]}`}>
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
                            onClick={() => handleDelete(evaluation.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}

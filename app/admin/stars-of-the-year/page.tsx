'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { Star, Trophy, Medal, CheckCircle, Loader2 } from 'lucide-react';
import Image from 'next/image';

interface AcademicYear {
  id: string;
  name: string;
  start_date?: string;
  end_date?: string;
  is_active?: boolean;
}

interface Class {
  id: string;
  name: string;
}

interface StudentRanking {
  id: string;
  name: string;
  total: number;
}

interface ConfirmedStar {
  student_id: string;
  position: 1 | 2 | 3;
}

const MEDAL_ICONS = {
  1: <Trophy className="h-8 w-8 text-yellow-500" />,
  2: <Medal className="h-8 w-8 text-gray-400" />,
  3: <Medal className="h-8 w-8 text-amber-600" />,
};

const MEDAL_EMOJIS = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
};

const POSITION_LABELS = {
  1: 'الأول',
  2: 'الثاني',
  3: 'الثالث',
};

export default function StarsOfTheYearPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  
  const [students, setStudents] = useState<StudentRanking[]>([]);
  const [selectedTop3, setSelectedTop3] = useState<ConfirmedStar[]>([]);
  
  const [savedStars, setSavedStars] = useState<any[]>([]);
  const [showSavedStars, setShowSavedStars] = useState(false);
  
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);

  // Load academic years and classes on mount
  useEffect(() => {
    loadFilters();
  }, []);

  // Load saved stars when class or year changes
  useEffect(() => {
    if (selectedClass && selectedAcademicYear) {
      loadSavedStars();
    } else {
      setSavedStars([]);
      setShowSavedStars(false);
    }
  }, [selectedClass, selectedAcademicYear]);

  const loadSavedStars = async () => {
    try {
      const response = await fetch(`/api/stars-of-the-year?academic_year_id=${selectedAcademicYear}`);
      if (response.ok) {
        const data = await response.json();
        // Filter stars for selected class only
        const classStars = (data.stars || []).filter((star: any) => {
          // Match by class name since API returns class name
          const className = classes.find(c => c.id === selectedClass)?.name;
          return star.class === className;
        });
        setSavedStars(classStars);
        setShowSavedStars(classStars.length > 0);
      }
    } catch (error) {
      console.error('Error loading saved stars:', error);
    }
  };

  const loadFilters = async () => {
    try {
      const [yearsRes, classesRes] = await Promise.all([
        fetch('/api/academic-years'),
        fetch('/api/classes'),
      ]);
      
      if (yearsRes.ok) {
        const yearsData = await yearsRes.json();
        const years = yearsData.academicYears || [];
        setAcademicYears(years);
        
        // Auto-select the active academic year (is_active = true)
        const activeYear = years.find((y: AcademicYear) => y.is_active);
        
        if (activeYear) {
          setSelectedAcademicYear(activeYear.id);
        } else if (years.length > 0) {
          // Fallback to most recent year
          setSelectedAcademicYear(years[0].id);
        }
      }
      
      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData.classes || []);
      }
    } catch (error) {
      console.error('Error loading filters:', error);
    }
  };

  const calculateTopStudents = async () => {
    if (!selectedClass || !selectedAcademicYear) {
      toast({
        title: 'تنبيه',
        description: 'الرجاء اختيار الصف والسنة الدراسية',
        variant: 'destructive',
      });
      return;
    }

    try {
      setCalculating(true);
      const response = await fetch('/api/stars-of-the-year/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          academic_year_id: selectedAcademicYear,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
        
        // Auto-select top 3
        const top3 = (data.students || []).slice(0, 3).map((s: StudentRanking, index: number) => ({
          student_id: s.id,
          position: (index + 1) as 1 | 2 | 3,
        }));
        setSelectedTop3(top3);
        
        if (data.students?.length === 0) {
          toast({
            title: 'تنبيه',
            description: 'لا توجد بيانات علامات لهذا الصف',
          });
        }
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في حساب النتائج',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error calculating:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const confirmStars = async () => {
    if (selectedTop3.length === 0) {
      toast({
        title: 'تنبيه',
        description: 'الرجاء اختيار نجوم السنة أولاً',
        variant: 'destructive',
      });
      return;
    }

    try {
      setSaving(true);
      const response = await fetch('/api/stars-of-the-year/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          class_id: selectedClass,
          academic_year_id: selectedAcademicYear,
          top_students: selectedTop3,
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حفظ نجوم السنة',
        });
        setIsConfirmDialogOpen(false);
        // Reset calculation
        setStudents([]);
        setSelectedTop3([]);
        // Refresh saved stars display
        await loadSavedStars();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في الحفظ',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getTop3Students = () => {
    return selectedTop3.map(star => {
      const student = students.find(s => s.id === star.student_id);
      return { ...star, student };
    }).sort((a, b) => a.position - b.position);
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole="admin">
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">نجوم السنة</h1>
          </div>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>اختيار الصف والسنة الدراسية</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">السنة الدراسية</label>
                <Select value={selectedAcademicYear} onValueChange={setSelectedAcademicYear}>
                  <SelectTrigger>
                    <SelectValue placeholder="اختر السنة الدراسية" />
                  </SelectTrigger>
                  <SelectContent>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">الصف</label>
                <Select value={selectedClass} onValueChange={setSelectedClass}>
                  <SelectTrigger>
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

              <div className="flex items-end">
                <Button 
                  onClick={calculateTopStudents} 
                  disabled={calculating || !selectedClass || !selectedAcademicYear}
                  className="w-full bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  {calculating ? (
                    <>
                      <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                      جاري الحساب...
                    </>
                  ) : (
                    <>
                      <Star className="ml-2 h-4 w-4" />
                      حساب نجوم السنة
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Saved Stars Section */}
        {showSavedStars && savedStars.length > 0 && (
          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-6 w-6 text-green-600" />
                نجوم السنة المعتمدة لهذا الصف
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {savedStars.sort((a, b) => a.position - b.position).map((star: any) => (
                  <div 
                    key={star.position} 
                    className={`p-4 rounded-xl border-2 text-center ${
                      star.position === 1 ? 'border-yellow-400 bg-yellow-100' :
                      star.position === 2 ? 'border-gray-400 bg-gray-100' :
                      'border-amber-600 bg-amber-100'
                    }`}
                  >
                    <div className="text-4xl mb-2">
                      {star.position === 1 ? '🥇' : star.position === 2 ? '🥈' : '🥉'}
                    </div>
                    <div className="text-lg font-bold mb-1">
                      {star.position === 1 ? 'الأول' : star.position === 2 ? 'الثاني' : 'الثالث'}
                    </div>
                    <div className="text-xl font-bold text-gray-800 mb-2">
                      {star.student_name}
                    </div>
                    {/* Display student image from students table */}
                    {star.image_url && (
                      <div className="relative w-24 h-24 mx-auto rounded-full overflow-hidden border-2 border-white shadow-lg mt-3">
                        <Image
                          src={star.image_url}
                          alt={star.student_name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-4 text-center">
                <p className="text-sm text-gray-600">
                  إذا كنت تريد تغيير نجوم السنة، اضغط على &quot;حساب نجوم السنة&quot; لإعادة الحساب
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Top 3 Preview with Medals */}
        {students.length > 0 && (
          <>
            <Card className="border-yellow-200 bg-gradient-to-br from-yellow-50 to-orange-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-6 w-6 text-yellow-500" />
                  نجوم السنة المرشحون
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {getTop3Students().map(({ position, student }) => (
                    <div 
                      key={position} 
                      className={`p-4 rounded-xl border-2 text-center ${
                        position === 1 ? 'border-yellow-400 bg-yellow-100' :
                        position === 2 ? 'border-gray-400 bg-gray-100' :
                        'border-amber-600 bg-amber-100'
                      }`}
                    >
                      <div className="text-4xl mb-2">{MEDAL_EMOJIS[position as 1|2|3]}</div>
                      <div className="text-lg font-bold mb-1">
                        {POSITION_LABELS[position as 1|2|3]}
                      </div>
                      <div className="text-xl font-bold text-gray-800 mb-2">
                        {student?.name || 'غير محدد'}
                      </div>
                      <div className="text-sm text-gray-600 mb-3">
                        المجموع: {student?.total || 0}
                      </div>
                      {/* Display student image if available */}
                      {(student as any)?.image_url && (
                        <div className="relative w-20 h-20 mx-auto rounded-full overflow-hidden border-2 border-white shadow mt-2">
                          <Image
                            src={(student as any).image_url}
                            alt={student?.name || ''}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Confirm Button */}
                <div className="mt-6 text-center">
                  <Button
                    onClick={() => setIsConfirmDialogOpen(true)}
                    disabled={saving}
                    className="bg-green-600 hover:bg-green-700 text-white px-8"
                    size="lg"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                        جاري الحفظ...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="ml-2 h-5 w-5" />
                        تأكيد نجوم السنة
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Full Rankings Table */}
            <Card>
              <CardHeader>
                <CardTitle>ترتيب جميع الطلاب</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الترتيب</TableHead>
                      <TableHead className="text-right">الطالب</TableHead>
                      <TableHead className="text-right">مجموع العلامات</TableHead>
                      <TableHead className="text-right">الوسام</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students.map((student, index) => {
                      const isTop3 = index < 3;
                      return (
                        <TableRow 
                          key={student.id}
                          className={isTop3 ? 'bg-yellow-50' : ''}
                        >
                          <TableCell className="font-bold">{index + 1}</TableCell>
                          <TableCell className="font-medium">{student.name}</TableCell>
                          <TableCell className="font-bold text-brand-primary-blue">
                            {student.total}
                          </TableCell>
                          <TableCell>
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </>
        )}

        {/* Confirmation Dialog */}
        <Dialog open={isConfirmDialogOpen} onOpenChange={setIsConfirmDialogOpen}>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle className="text-center">تأكيد نجوم السنة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <p className="text-center text-gray-600">
                سيتم حفظ النجوم الثلاثة التالية للصف {classes.find(c => c.id === selectedClass)?.name} للسنة الدراسية {academicYears.find(y => y.id === selectedAcademicYear)?.name}
              </p>
              
              <div className="space-y-2">
                {getTop3Students().map(({ position, student }) => (
                  <div key={position} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    <span className="text-2xl">{MEDAL_EMOJIS[position as 1|2|3]}</span>
                    <div>
                      <div className="font-bold">{student?.name}</div>
                      <div className="text-sm text-gray-600">
                        {POSITION_LABELS[position as 1|2|3]} - المجموع: {student?.total}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setIsConfirmDialogOpen(false)}
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button
                  onClick={confirmStars}
                  disabled={saving}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saving ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    'تأكيد'
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

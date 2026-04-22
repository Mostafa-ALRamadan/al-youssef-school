'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { CalendarDays, CheckCircle, Edit2, Plus, School, Trash2 } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { formatDate, toArabicNumerals } from '@/utils/date';

interface AcademicYear {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

interface Semester {
  id: string;
  academic_year_id: string;
  name: string;
  start_date: string;
  end_date: string;
  is_active: boolean;
  created_at: string;
}

export default function AcademicYearsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [selectedYear, setSelectedYear] = useState<AcademicYear | null>(null);

  // Dialog states
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [semesterDialogOpen, setSemesterDialogOpen] = useState(false);
  const [editYearDialogOpen, setEditYearDialogOpen] = useState(false);
  const [editSemesterDialogOpen, setEditSemesterDialogOpen] = useState(false);
  const [editingYear, setEditingYear] = useState<AcademicYear | null>(null);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);

  // Form states
  const [yearForm, setYearForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });

  const [semesterForm, setSemesterForm] = useState({
    name: '',
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load academic years from API
      const yearsResponse = await fetch('/api/academic-years');
      if (!yearsResponse.ok) throw new Error('Failed to load academic years');
      const yearsData = await yearsResponse.json();
      setYears(yearsData.academicYears || []);

      // Load semesters from API
      const semestersResponse = await fetch('/api/semesters');
      if (!semestersResponse.ok) throw new Error('Failed to load semesters');
      const semestersData = await semestersResponse.json();
      setSemesters(semestersData.semesters || []);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحميل البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateYear = async () => {
    if (!yearForm.name || !yearForm.start_date || !yearForm.end_date) {
      toast({
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/academic-years', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: yearForm.name,
          start_date: yearForm.start_date,
          end_date: yearForm.end_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create academic year');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء السنة الدراسية',
      });
      setYearDialogOpen(false);
      setYearForm({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      console.error('Error creating year:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const handleCreateSemester = async () => {
    if (!selectedYear || !semesterForm.name || !semesterForm.start_date || !semesterForm.end_date) {
      toast({
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          academic_year_id: selectedYear.id,
          name: semesterForm.name,
          start_date: semesterForm.start_date,
          end_date: semesterForm.end_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create semester');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم إنشاء الفصل الدراسي',
      });
      setSemesterDialogOpen(false);
      setSemesterForm({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      console.error('Error creating semester:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في إنشاء الفصل الدراسي',
        variant: 'destructive',
      });
    }
  };

  const setActiveYear = async (yearId: string) => {
    try {
      const response = await fetch('/api/academic-years/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ yearId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set active year');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تفعيل السنة الدراسية',
      });
      loadData();
    } catch (error) {
      console.error('Error setting active year:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تفعيل السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const setActiveSemester = async (semesterId: string) => {
    try {
      const response = await fetch('/api/semesters/set-active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semesterId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to set active semester');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تفعيل الفصل الدراسي والسنة',
      });
      loadData();
    } catch (error) {
      console.error('Error setting active semester:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تفعيل الفصل الدراسي',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteYear = async (yearId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه السنة الدراسية؟ سيتم حذف جميع الفصول المرتبطة بها أيضاً.')) {
      return;
    }

    try {
      const response = await fetch(`/api/academic-years/${yearId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete year');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف السنة الدراسية',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting year:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSemester = async (semesterId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الفصل الدراسي؟')) {
      return;
    }

    try {
      const response = await fetch(`/api/semesters/${semesterId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete semester');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم حذف الفصل الدراسي',
      });
      loadData();
    } catch (error) {
      console.error('Error deleting semester:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في حذف الفصل الدراسي',
        variant: 'destructive',
      });
    }
  };

  const openEditYear = (year: AcademicYear) => {
    setEditingYear(year);
    
    setYearForm({
      name: year.name,
      start_date: year.start_date || '',
      end_date: year.end_date || '',
    });
    setEditYearDialogOpen(true);
  };

  const openEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    
    setSemesterForm({
      name: semester.name,
      start_date: semester.start_date || '',
      end_date: semester.end_date || '',
    });
    setEditSemesterDialogOpen(true);
  };

  const handleUpdateYear = async () => {
    if (!editingYear || !yearForm.name || !yearForm.start_date || !yearForm.end_date) {
      toast({
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/academic-years/${editingYear.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: yearForm.name,
          start_date: yearForm.start_date,
          end_date: yearForm.end_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update year');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث السنة الدراسية',
      });
      setEditYearDialogOpen(false);
      setEditingYear(null);
      setYearForm({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      console.error('Error updating year:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث السنة الدراسية',
        variant: 'destructive',
      });
    }
  };

  const handleUpdateSemester = async () => {
    if (!editingSemester || !semesterForm.name || !semesterForm.start_date || !semesterForm.end_date) {
      toast({
        title: 'خطأ',
        description: 'جميع الحقول مطلوبة',
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/semesters/${editingSemester.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: semesterForm.name,
          start_date: semesterForm.start_date,
          end_date: semesterForm.end_date,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update semester');
      }

      toast({
        title: 'تم بنجاح',
        description: 'تم تحديث الفصل الدراسي',
      });
      setEditSemesterDialogOpen(false);
      setEditingSemester(null);
      setSemesterForm({ name: '', start_date: '', end_date: '' });
      loadData();
    } catch (error) {
      console.error('Error updating semester:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في تحديث الفصل الدراسي',
        variant: 'destructive',
      });
    }
  };

  const getSemestersForYear = (yearId: string) => {
    return semesters.filter((s) => s.academic_year_id === yearId);
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6 space-y-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">السنوات والفصول الدراسية</h1>
          </div>
          <Button
            onClick={() => setYearDialogOpen(true)}
            className="bg-brand-primary-blue hover:bg-brand-dark-blue"
          >
            <Plus className="h-4 w-4 ml-2" />
            سنة دراسية جديدة
          </Button>
        </div>

        {/* Academic Years List */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : years.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-gray-500">
              لا توجد سنوات دراسية. قم بإنشاء سنة جديدة.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {years.map((year) => (
              <Card key={year.id} className={year.is_active ? 'border-green-500 border-2' : ''}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <School className="h-5 w-5 text-brand-primary-blue" />
                      <CardTitle className="text-lg">{toArabicNumerals(year.name)}</CardTitle>
                      {year.is_active && (
                        <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                          نشطة
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedYear(year);
                          setSemesterDialogOpen(true);
                        }}
                      >
                        <Plus className="h-4 w-4 ml-1" />
                        فصل جديد
                      </Button>
                      {!year.is_active && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setActiveYear(year.id)}
                        >
                          <CheckCircle className="h-4 w-4 ml-1" />
                          تفعيل
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditYear(year)}
                      >
                        <Edit2 className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteYear(year.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(year.start_date)} - {formatDate(year.end_date)}
                  </p>
                </CardHeader>

                {/* Semesters Table */}
                <CardContent>
                  {getSemestersForYear(year.id).length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الفصل</TableHead>
                          <TableHead className="text-right">تاريخ البداية</TableHead>
                          <TableHead className="text-right">تاريخ النهاية</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {getSemestersForYear(year.id).map((semester) => (
                          <TableRow key={semester.id}>
                            <TableCell className="font-medium">{semester.name}</TableCell>
                            <TableCell>{formatDate(semester.start_date)}</TableCell>
                            <TableCell>{formatDate(semester.end_date)}</TableCell>
                            <TableCell>
                              {semester.is_active ? (
                                <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs">
                                  نشط
                                </span>
                              ) : (
                                <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                                  غير نشط
                                </span>
                              )}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {!semester.is_active && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setActiveSemester(semester.id)}
                                  >
                                    <CheckCircle className="h-4 w-4 text-green-600" />
                                  </Button>
                                )}
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openEditSemester(semester)}
                                >
                                  <Edit2 className="h-4 w-4 text-blue-600" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDeleteSemester(semester.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-sm text-gray-500 py-4 text-center">
                      لا توجد فصول دراسية لهذه السنة
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create Year Dialog */}
        <Dialog open={yearDialogOpen} onOpenChange={setYearDialogOpen}>
          <DialogContent dir="rtl" className="[&>button]:hidden">
            <DialogHeader>
              <DialogTitle>إنشاء سنة دراسية جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم السنة الدراسية</Label>
                <Input
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="مثال: 2024-2025"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={yearForm.start_date}
                  onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={yearForm.end_date}
                  onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setYearDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateYear}
                  className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  إنشاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Create Semester Dialog */}
        <Dialog open={semesterDialogOpen} onOpenChange={setSemesterDialogOpen}>
          <DialogContent dir="rtl" className="[&>button]:hidden">
            <DialogHeader>
              <DialogTitle>
                إنشاء فصل دراسي جديد - {selectedYear?.name}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم الفصل الدراسي</Label>
                <Input
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                  placeholder="مثال: الفصل الدراسي الأول"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={semesterForm.start_date}
                  onChange={(e) => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={semesterForm.end_date}
                  onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setSemesterDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleCreateSemester}
                  className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  إنشاء
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Year Dialog */}
        <Dialog open={editYearDialogOpen} onOpenChange={setEditYearDialogOpen}>
          <DialogContent dir="rtl" className="[&>button]:hidden">
            <DialogHeader>
              <DialogTitle>تعديل السنة الدراسية</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم السنة الدراسية</Label>
                <Input
                  value={yearForm.name}
                  onChange={(e) => setYearForm({ ...yearForm, name: e.target.value })}
                  placeholder="مثال: 2024-2025"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={yearForm.start_date}
                  onChange={(e) => setYearForm({ ...yearForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={yearForm.end_date}
                  onChange={(e) => setYearForm({ ...yearForm, end_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditYearDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpdateYear}
                  className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Edit Semester Dialog */}
        <Dialog open={editSemesterDialogOpen} onOpenChange={setEditSemesterDialogOpen}>
          <DialogContent dir="rtl" className="[&>button]:hidden">
            <DialogHeader>
              <DialogTitle>تعديل الفصل الدراسي</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>اسم الفصل الدراسي</Label>
                <Input
                  value={semesterForm.name}
                  onChange={(e) => setSemesterForm({ ...semesterForm, name: e.target.value })}
                  placeholder="مثال: الفصل الدراسي الأول"
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ البداية</Label>
                <Input
                  type="date"
                  value={semesterForm.start_date}
                  onChange={(e) => setSemesterForm({ ...semesterForm, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>تاريخ النهاية</Label>
                <Input
                  type="date"
                  value={semesterForm.end_date}
                  onChange={(e) => setSemesterForm({ ...semesterForm, end_date: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditSemesterDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button
                  onClick={handleUpdateSemester}
                  className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  حفظ التغييرات
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

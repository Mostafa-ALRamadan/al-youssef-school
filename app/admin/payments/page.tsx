'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Eye, Plus, Wallet, CreditCard, TrendingDown, Users } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/utils/number';
import { toArabicNumerals } from '@/utils/date';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';

// Arabic date formatter for academic years
const formatArabicDate = (dateString: string): string => {
  // Handle different formats: "2025-2026", "2025-01-01", or just "2025"
  let year: number;
  
  if (dateString.includes('-') && dateString.split('-').length === 2) {
    // Format: "2025-2026" - extract first year
    year = parseInt(dateString.split('-')[0]);
  } else if (dateString.includes('-') && dateString.split('-').length === 3) {
    // Format: "2025-01-01" - use Date object
    const date = new Date(dateString);
    year = date.getFullYear();
  } else {
    // Format: just a year string
    year = parseInt(dateString);
  }
  
  // Fallback if still NaN
  if (isNaN(year)) {
    return dateString;
  }
  
  return `${toArabicNumerals(year)}-${toArabicNumerals(year + 1)}`;
};

interface StudentFee {
  id: string;
  student_id: string;
  student_name: string;
  academic_year_name: string;
  school_fee: number;
  transport_fee: number;
  total_fees?: number;
  total_paid?: number;
  remaining_balance?: number;
}

interface PaymentSummary {
  total_fees: number;
  total_paid: number;
  total_remaining: number;
  student_count: number;
}

export default function PaymentsPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [fees, setFees] = useState<StudentFee[]>([]);
  const [filteredFees, setFilteredFees] = useState<StudentFee[]>([]);
  const [summary, setSummary] = useState<PaymentSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [students, setStudents] = useState<{ id: string; name: string }[]>([]);
  const [academicYears, setAcademicYears] = useState<{ id: string; name: string }[]>([]);
  const [teacherSessions, setTeacherSessions] = useState<{ id: string; name: string; sessionCount: number }[]>([]);
  const [showTeacherSessions, setShowTeacherSessions] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    academic_year_id: '',
    school_fee: '',
    transport_fee: '',
  });

  // Get actual user role from auth system
  const [isMainAdmin, setIsMainAdmin] = useState<boolean>(false);
  const [authUser, setAuthUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage or auth context
    const getUserData = async () => {
      try {
        // For now, get user data from a simple API call or localStorage
        // This should be replaced with proper auth context when available
        const token = localStorage.getItem('auth_token');
        if (token) {
          // Decode JWT or make API call to get user data
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const response_data = await response.json();
            const userData = response_data.user;
            setAuthUser(userData);
            setIsMainAdmin(userData.is_main_admin || false);
          } else {
            // Fallback: assume sub-admin if no auth
            setIsMainAdmin(false);
          }
        } else {
          // Fallback: assume sub-admin if no token
          setIsMainAdmin(false);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        // Fallback: assume sub-admin on error
        setIsMainAdmin(false);
      }
    };

    getUserData();
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const filtered = fees.filter((fee) =>
      fee.student_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredFees(filtered);
  }, [searchTerm, fees]);

  const fetchData = async () => {
    try {
      const [feesRes, summaryRes, studentsRes, yearsRes] = await Promise.all([
        fetch('/api/fees'),
        fetch('/api/fees/summary'),
        fetch('/api/students'),
        fetch('/api/academic-years'),
      ]);

      const feesData = await feesRes.json();
      const summaryData = await summaryRes.json();
      const studentsData = await studentsRes.json();
      const yearsData = await yearsRes.json();

      if (feesData.fees) {
        const feesWithCalculated = feesData.fees.map((fee: StudentFee) => {
          const schoolFee = Number(fee.school_fee) || 0;
          const transportFee = Number(fee.transport_fee) || 0;
          const totalPaid = Number(fee.total_paid) || 0;
          return {
            ...fee,
            school_fee: schoolFee,
            transport_fee: transportFee,
            total_fees: schoolFee + transportFee,
            total_paid: totalPaid,
            remaining_balance: schoolFee + transportFee - totalPaid,
          };
        });
        setFees(feesWithCalculated);
        setFilteredFees(feesWithCalculated);
      }
      if (summaryData.summary) setSummary(summaryData.summary);
      if (studentsData.students) setStudents(studentsData.students);
      if (yearsData.academicYears) setAcademicYears(yearsData.academicYears);
      
      // Fetch teacher sessions
      try {
        const sessionsResponse = await fetch('/api/teacher-sessions');
        const sessionsData = await sessionsResponse.json();
        if (sessionsData.teacherSessions) setTeacherSessions(sessionsData.teacherSessions);
      } catch (error) {
        console.error('Error fetching teacher sessions:', error);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'خطأ',
        description: 'فشل في جلب البيانات',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          school_fee: parseFloat(formData.school_fee) || 0,
          transport_fee: parseFloat(formData.transport_fee) || 0,
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء سجل الأقساط',
        });
        setIsAddDialogOpen(false);
        setFormData({ student_id: '', academic_year_id: '', school_fee: '', transport_fee: '' });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في إنشاء سجل الأقساط',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating fee:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const viewDetails = (feeId: string) => {
    router.push(`/admin/payments/${feeId}`);
  };

  if (loading) {
    return (
      <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole="admin" isMainAdmin={isMainAdmin}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole="admin" isMainAdmin={isMainAdmin}>
      <div className="space-y-6 p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wallet className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">الأقساط</h1>
          </div>
          {isMainAdmin && (
            <Button className="bg-brand-primary-blue hover:bg-brand-dark-blue" onClick={() => setIsAddDialogOpen(true)}>
              <Plus className="ml-2 h-4 w-4" />
              إضافة قسط جديد
            </Button>
          )}
        </div>

        {/* Financial Summary - Main Admin Only */}
        {isMainAdmin && summary && (
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الأقساط</CardTitle>
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(summary.total_fees)}</div>
                <p className="text-xs text-muted-foreground">ل.س</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المدفوع</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{formatNumber(summary.total_paid)}</div>
                <p className="text-xs text-muted-foreground">ل.س</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي المتبقي</CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{formatNumber(summary.total_remaining)}</div>
                <p className="text-xs text-muted-foreground">ل.س</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students Count - Main Admin Only */}
        {isMainAdmin && summary && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">عدد الطلاب المسجلين</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(summary.student_count)}</div>
              <p className="text-xs text-muted-foreground">طالب</p>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="البحث عن طالب..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-10"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الطالب</TableHead>
                <TableHead className="text-right">السنة الدراسية</TableHead>
                {isMainAdmin && <TableHead className="text-right">قسط المدرسة</TableHead>}
                {isMainAdmin && <TableHead className="text-right">قسط المواصلات</TableHead>}
                {isMainAdmin && <TableHead className="text-right">المجموع الكلي</TableHead>}
                {isMainAdmin && <TableHead className="text-right">المدفوع</TableHead>}
                <TableHead className="text-right">المتبقي</TableHead>
                {isMainAdmin && <TableHead className="text-right">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFees.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isMainAdmin ? 8 : 3} className="text-center py-8">
                    لا توجد بيانات
                  </TableCell>
                </TableRow>
              ) : (
                filteredFees.map((fee) => (
                  <TableRow key={fee.id}>
                    <TableCell className="font-medium">{fee.student_name}</TableCell>
                    <TableCell>{formatArabicDate(fee.academic_year_name)}</TableCell>
                    {isMainAdmin && (
                      <TableCell>{formatNumber(fee.school_fee)} ل.س</TableCell>
                    )}
                    {isMainAdmin && (
                      <TableCell>{formatNumber(fee.transport_fee)} ل.س</TableCell>
                    )}
                    {isMainAdmin && (
                      <TableCell className="font-medium">{formatNumber(fee.total_fees || 0)} ل.س</TableCell>
                    )}
                    {isMainAdmin && (
                      <TableCell className="text-green-600">{formatNumber(fee.total_paid || 0)} ل.س</TableCell>
                    )}
                    <TableCell className={fee.remaining_balance && fee.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'}>
                      {formatNumber(fee.remaining_balance || 0)} ل.س
                    </TableCell>
                    {isMainAdmin && (
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => router.push(`/admin/payments/${fee.id}`)}
                          >
                            <Eye className="h-4 w-4 text-blue-600" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Teacher Sessions Toggle - Main Admin Only */}
        {isMainAdmin && (
          <div className="flex justify-center mt-6">
            <Button
              className="bg-brand-primary-blue hover:bg-brand-dark-blue flex items-center gap-2"
              onClick={() => setShowTeacherSessions(!showTeacherSessions)}
            >
              {showTeacherSessions ? 'إخفاء جلسات المعلمين' : 'عرض جلسات المعلمين'}
            </Button>
          </div>
        )}

        {/* Teacher Sessions - Main Admin Only */}
        {isMainAdmin && showTeacherSessions && teacherSessions.length > 0 && (
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-brand-primary-blue" />
                <CardTitle className="text-lg font-bold">جلسات المعلمين</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">عدد الجلسات التي قدمها كل معلم</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {teacherSessions.map((teacher) => (
                  <div key={teacher.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="font-medium">{teacher.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-brand-primary-blue">{teacher.sessionCount}</span>
                      <span className="text-sm text-muted-foreground">جلسة</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Add Fee Dialog - Main Admin Only */}
        {isMainAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
              <DialogHeader>
                <DialogTitle>إضافة قسط جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الطالب</Label>
                  <Select
                    value={formData.student_id}
                    onValueChange={(value) => setFormData({ ...formData, student_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الطالب" />
                    </SelectTrigger>
                    <SelectContent>
                      {students.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>السنة الدراسية</Label>
                  <Select
                    value={formData.academic_year_id}
                    onValueChange={(value) => setFormData({ ...formData, academic_year_id: value })}
                  >
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

                <div className="space-y-2">
                  <Label>قسط المدرسة (ل.س)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.school_fee}
                    onChange={(e) => setFormData({ ...formData, school_fee: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <Label>قسط المواصلات (ل.س)</Label>
                  <Input
                    type="number"
                    min="0"
                    value={formData.transport_fee}
                    onChange={(e) => setFormData({ ...formData, transport_fee: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
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
        )}
      </div>
    </DashboardLayout>
  );
}

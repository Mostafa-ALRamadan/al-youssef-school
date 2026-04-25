'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
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
import { ArrowLeft, Plus, Trash2, Wallet, CreditCard, TrendingDown } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { formatNumber } from '@/utils/number';
import { formatDate, toArabicNumerals } from '@/utils/date';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';

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

interface FeePayment {
  id: string;
  amount: number;
  payment_date: string;
  payment_method: 'cash' | 'bank' | 'online';
  notes?: string;
  created_at: string;
}

export default function PaymentDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const { toast } = useToast();
  const feeId = params.id as string;

  const [fee, setFee] = useState<StudentFee | null>(null);
  const [payments, setPayments] = useState<FeePayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<FeePayment | null>(null);
  const [deletingPaymentId, setDeletingPaymentId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    payment_date: new Date().toISOString().split('T')[0],
    payment_method: 'cash',
    notes: '',
  });

  // Get actual user role from auth system
  const [isMainAdmin, setIsMainAdmin] = useState<boolean>(false);

  useEffect(() => {
    // Get current user from localStorage or auth context
    const getUserData = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (token) {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          if (response.ok) {
            const response_data = await response.json();
            const userData = response_data.user;
            setIsMainAdmin(userData.is_main_admin || false);
          } else {
            setIsMainAdmin(false);
          }
        } else {
          setIsMainAdmin(false);
        }
      } catch (error) {
        console.error('Error getting user data:', error);
        setIsMainAdmin(false);
      }
    };

    getUserData();
  }, []);

  useEffect(() => {
    if (feeId) {
      fetchData();
    }
  }, [feeId]);

  const fetchData = async () => {
    try {
      const [feeRes, paymentsRes] = await Promise.all([
        fetch(`/api/fees/${feeId}`),
        fetch(`/api/fees/${feeId}/payments`),
      ]);

      const feeData = await feeRes.json();
      const paymentsData = await paymentsRes.json();

      if (feeData.fee) {
        const fee = feeData.fee;
        const schoolFee = Number(fee.school_fee) || 0;
        const transportFee = Number(fee.transport_fee) || 0;
        const totalPaid = Number(fee.total_paid) || 0;
        setFee({
          ...fee,
          school_fee: schoolFee,
          transport_fee: transportFee,
          total_fees: schoolFee + transportFee,
          total_paid: totalPaid,
          remaining_balance: schoolFee + transportFee - totalPaid,
        });
      }
      if (paymentsData.payments) {
        const paymentsWithNumbers = paymentsData.payments.map((payment: FeePayment) => ({
          ...payment,
          amount: Number(payment.amount) || 0,
        }));
        setPayments(paymentsWithNumbers);
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

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast({
        title: 'خطأ',
        description: 'المبلغ يجب أن يكون أكبر من صفر',
        variant: 'destructive',
      });
      return;
    }

    // Check if remaining balance is 0
    const remainingBalance = fee?.remaining_balance ?? 0;
    
    if (remainingBalance === 0) {
      const errorMsg = 'لا يوجد رصيد متبقي للدفع - تم تسديد كامل المبلغ';
      alert(errorMsg);
      toast({
        title: 'خطأ',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }
    
    // Check if amount exceeds remaining balance
    if (amount > remainingBalance) {
      const errorMsg = `المبلغ المدفوع (${formatNumber(amount)}) يتجاوز الرصيد المتبقي (${formatNumber(remainingBalance)})`;
      alert(errorMsg);
      toast({
        title: 'خطأ',
        description: errorMsg,
        variant: 'destructive',
      });
      return;
    }

    try {
      const response = await fetch(`/api/fees/${feeId}/payments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          payment_date: formData.payment_date,
          payment_method: formData.payment_method,
          notes: formData.notes,
          // created_by: user?.id, // TODO: Pass user ID from server or context
        }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة الدفعة',
        });
        setIsAddDialogOpen(false);
        setFormData({
          amount: '',
          payment_date: new Date().toISOString().split('T')[0],
          payment_method: 'cash',
          notes: '',
        });
        fetchData();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في إضافة الدفعة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding payment:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleDeletePayment = async (paymentId: string) => {
    setDeletingPaymentId(paymentId);

    try {
      const response = await fetch(`/api/fees/${feeId}/payments/${paymentId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الدفعة',
        });
        setSelectedPayment(null);
        fetchData();
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل حذف الدفعة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف الدفعة',
        variant: 'destructive',
      });
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const getPaymentMethodLabel = (method: string) => {
    switch (method) {
      case 'cash': return 'نقدي';
      case 'bank': return 'بنكي';
      case 'online': return 'إلكتروني';
      default: return method;
    }
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

  if (!fee) {
    return (
      <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole="admin" isMainAdmin={isMainAdmin}>
        <div className="flex h-full items-center justify-center">
          <div className="text-center">لم يتم العثور على بيانات</div>
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
            <h1 className="text-2xl font-bold">تفاصيل الأقساط</h1>
          </div>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-muted-foreground">{fee.student_name} - {formatArabicDate(fee.academic_year_name)}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => router.push('/admin/payments')}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Sub-admin message */}
        {!isMainAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            <p className="text-sm">يمكنك فقط عرض بيانات الأقساط والمدفوعات. لا يمكنك إضافة دفعات.</p>
          </div>
        )}

        {/* Fee Summary Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قسط المدرسة</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(fee.school_fee)}</div>
              <p className="text-xs text-muted-foreground">ل.س</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">قسط المواصلات</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatNumber(fee.transport_fee)}</div>
              <p className="text-xs text-muted-foreground">ل.س</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المدفوع</CardTitle>
              <Wallet className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{formatNumber(fee.total_paid || 0)}</div>
              <p className="text-xs text-muted-foreground">ل.س</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">المتبقي</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${fee.remaining_balance && fee.remaining_balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                {formatNumber(fee.remaining_balance || 0)}
              </div>
              <p className="text-xs text-muted-foreground">ل.س</p>
            </CardContent>
          </Card>
        </div>

        {/* Payment History */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">سجل المدفوعات</h2>
            {isMainAdmin && (
              <Button className="bg-brand-primary-blue hover:bg-brand-dark-blue" onClick={() => setIsAddDialogOpen(true)}>
                <Plus className="ml-2 h-4 w-4" />
                إضافة دفعة جديدة
              </Button>
            )}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المبلغ</TableHead>
                  <TableHead className="text-right">التاريخ</TableHead>
                  <TableHead className="text-right">طريقة الدفع</TableHead>
                  <TableHead className="text-right">ملاحظات</TableHead>
                  {isMainAdmin && <TableHead className="text-right">الإجراءات</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMainAdmin ? 5 : 4} className="text-center py-8">
                      لا توجد دفعات مسجلة
                    </TableCell>
                  </TableRow>
                ) : (
                  payments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium text-green-600">{formatNumber(payment.amount)} ل.س</TableCell>
                      <TableCell>{formatDate(payment.payment_date)}</TableCell>
                      <TableCell>{getPaymentMethodLabel(payment.payment_method)}</TableCell>
                      <TableCell>{payment.notes || '-'}</TableCell>
                      {isMainAdmin && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedPayment(payment)}
                            disabled={deletingPaymentId === payment.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Add Payment Dialog */}
        {isMainAdmin && (
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
              <DialogHeader>
                <DialogTitle>إضافة دفعة جديدة</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>المبلغ (ل.س)</Label>
                  <Input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="أدخل المبلغ"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    الرصيد المتبقي: {formatNumber(fee.remaining_balance || 0)} ل.س
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>تاريخ الدفع</Label>
                  <Input
                    type="date"
                    value={formData.payment_date}
                    onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label>طريقة الدفع</Label>
                  <Select
                    value={formData.payment_method}
                    onValueChange={(value: string) =>
                      setFormData({ ...formData, payment_method: value as 'cash' | 'bank' | 'online' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر طريقة الدفع" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">نقدي</SelectItem>
                      <SelectItem value="bank">بنكي</SelectItem>
                      <SelectItem value="online">إلكتروني</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>ملاحظات</Label>
                  <Input
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="ملاحظات إضافية (اختياري)"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">إضافة الدفعة</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        )}

        {/* Delete Payment Confirmation */}
        {isMainAdmin && (
          <AlertDialog open={!!selectedPayment} onOpenChange={() => setSelectedPayment(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription>
                  هل أنت متأكد من حذف هذه الدفعة؟ لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setSelectedPayment(null)}>إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={() => selectedPayment && handleDeletePayment(selectedPayment.id)} className="bg-red-600">
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </DashboardLayout>
  );
}

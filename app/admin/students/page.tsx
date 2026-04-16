'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Trash2, Search, Users } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { createClient } from '@/lib/supabase';
import type { Student, Class } from '@/types';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';
import { USER_ROLES } from '@/constants';

type FormData = {
  name: string;
  class_id: string;
  parent_name: string;
  parent_phone: string;
  date_of_birth: string;
  gender: 'male' | 'female' | '';
};

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    class_id: '',
    parent_name: '',
    parent_password: '',
    parent_phone: '',
    parent_address: '',
    date_of_birth: '',
    gender: '' as 'male' | 'female' | '',
  });
  const [parentSearch, setParentSearch] = useState('');
  const [parentSuggestions, setParentSuggestions] = useState<Student[]>([]);
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  const [isExistingParent, setIsExistingParent] = useState(false);

  // Fetch students and classes
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students');
      const data = await response.json();
      if (response.ok) {
        setStudents(data.students || []);
      }
    } catch (error) {
      // Error handling silently
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (response.ok) {
        setClasses(data.classes || []);
      }
    } catch (error) {
      // Error handling silently
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({ name: '', class_id: '', parent_name: '', parent_password: '', parent_phone: '', parent_address: '', date_of_birth: '', gender: '' });
        fetchStudents();
      } else {
        console.error('Error:', data.error);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/students?id=${selectedStudent.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (error) {
      // Error handling silently
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;

    try {
      const response = await fetch(`/api/students?id=${selectedStudent.id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedStudent(null);
        fetchStudents();
      }
    } catch (error) {
      // Error handling silently
    }
  };

  const openEditDialog = (student: Student) => {
    setSelectedStudent(student);
    setParentSearch('');
    setFormData({
      name: student.name,
      class_id: student.class_id || '',
      parent_name: student.parent_name || '',
      parent_password: '',
      parent_phone: student.parent_phone || '',
      parent_address: student.parent_address || '',
      date_of_birth: student.date_of_birth || '',
      gender: student.gender || '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (student: Student) => {
    setSelectedStudent(student);
    setIsDeleteDialogOpen(true);
  };

  const handleParentSearchChange = (search: string) => {
    setParentSearch(search);
    
    if (search.length >= 3) {
      const matches = students.filter(s => 
        s.parent_phone?.includes(search) || 
        s.parent_name?.toLowerCase().includes(search.toLowerCase())
      );
      const uniqueParents = matches.filter((match, index, self) =>
        index === self.findIndex(m => m.parent_phone === match.parent_phone)
      );
      setParentSuggestions(uniqueParents);
      setShowParentSuggestions(uniqueParents.length > 0);
    } else {
      setShowParentSuggestions(false);
    }
  };

  const handleParentPhoneChange = (phone: string) => {
    setFormData({ ...formData, parent_phone: phone });
  };

  const selectParent = (parent: Student) => {
    setFormData({
      ...formData,
      parent_name: parent.parent_name || '',
      parent_phone: parent.parent_phone || '',
      parent_address: parent.parent_address || '',
      parent_password: '',
    });
    setIsExistingParent(true);
    setParentSearch('');
    setShowParentSuggestions(false);
  };


  // Convert phone numbers to Arabic numerals
  const formatPhoneNumber = (phone: string | undefined) => {
    if (!phone) return phone || '';
    return formatNumber(phone);
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold text-gray-900">إدارة الطلاب وأولياء الأمور</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button
              className="bg-brand-primary-blue hover:bg-brand-dark-blue"
              onClick={() => {
              setIsAddDialogOpen(true);
              setIsExistingParent(false);
              setParentSearch('');
              setFormData({ name: '', class_id: '', parent_name: '', parent_password: '', parent_phone: '', parent_address: '', date_of_birth: '', gender: '' });
            }}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة طالب
            </Button>
            <DialogContent className="[&>button]:hidden">
              <DialogHeader>
                <DialogTitle>إضافة طالب جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الطالب</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="أدخل اسم الطالب"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="class_id">الصف</Label>
                  <select
                    id="class_id"
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                    required
                  >
                    <option value="">اختر الصف</option>
                    {classes.map((cls) => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 relative">
                  <Label htmlFor="parent_search">البحث عن ولي أمر موجود (اختياري)</Label>
                  <Input
                    id="parent_search"
                    value={parentSearch}
                    onChange={(e) => handleParentSearchChange(e.target.value)}
                    placeholder="اكتب رقم هاتف أو اسم للبحث..."
                  />
                  {showParentSuggestions && parentSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                      <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b">اختر ولي أمر من القائمة</div>
                      {parentSuggestions.map((suggestion) => (
                        <button
                          key={suggestion.id}
                          type="button"
                          className="w-full px-4 py-2 text-right hover:bg-gray-100 border-b last:border-0"
                          onClick={() => selectParent(suggestion)}
                        >
                          <div className="font-medium">{suggestion.parent_name}</div>
                          <div className="text-sm text-gray-500">{formatPhoneNumber(suggestion.parent_phone) || '-'}</div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_phone">رقم هاتف ولي الأمر</Label>
                  <Input
                    id="parent_phone"
                    value={formData.parent_phone}
                    onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                    placeholder="أدخل رقم الهاتف"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_name">اسم ولي الأمر</Label>
                  <Input
                    id="parent_name"
                    value={formData.parent_name}
                    onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                    placeholder="أدخل اسم ولي الأمر"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_password">كلمة المرور لولي الأمر {isExistingParent && '(اختياري - ولي أمر موجود)'}</Label>
                  <Input
                    id="parent_password"
                    type="password"
                    value={formData.parent_password}
                    onChange={(e) => setFormData({ ...formData, parent_password: e.target.value })}
                    placeholder={isExistingParent ? "اترك فارغاً - كلمة المرور محفوظة" : "أدخل كلمة المرور للولي الأمر الجديد"}
                    required={!isExistingParent}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent_address">عنوان ولي الأمر</Label>
                  <Input
                    id="parent_address"
                    value={formData.parent_address}
                    onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                    placeholder="أدخل العنوان"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">تاريخ الميلاد</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="text-right"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="gender">الجنس</Label>
                  <select
                    id="gender"
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | '' })}
                    className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  >
                    <option value="">اختر الجنس</option>
                    <option value="male">ذكر</option>
                    <option value="female">أنثى</option>
                  </select>
                </div>
                <div className="flex gap-2 justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                    إضافة
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Students Table */}
          {isLoading ? (
            <div className="text-center py-8">جاري التحميل...</div>
          ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center px-4 py-3">اسم الطالب</TableHead>
                  <TableHead className="text-center px-4 py-3">الصف</TableHead>
                  <TableHead className="text-center px-4 py-3">اسم ولي الأمر</TableHead>
                  <TableHead className="text-center px-4 py-3">اسم الدخول (للتطبيق)</TableHead>
                  <TableHead className="text-center px-4 py-3">رقم الهاتف</TableHead>
                  <TableHead className="text-center px-4 py-3">العنوان</TableHead>
                  <TableHead className="text-center px-4 py-3">الجنس</TableHead>
                  <TableHead className="text-center px-4 py-3">تاريخ الميلاد</TableHead>
                  <TableHead className="text-center px-4 py-3">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center px-4 py-3">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {students.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                      لا يوجد طلاب حالياً
                    </TableCell>
                  </TableRow>
                ) : (
                  students.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="text-center px-4 py-3 font-medium">{student.name}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.class_name || '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.parent_name || '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.login_name || '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.parent_phone ? formatPhoneNumber(student.parent_phone) : '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.parent_address || '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.gender === 'male' ? 'ذكر' : student.gender === 'female' ? 'أنثى' : '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{student.date_of_birth ? formatDate(student.date_of_birth) : '-'}</TableCell>
                      <TableCell className="text-center px-4 py-3">{formatDate(student.created_at)}</TableCell>
                      <TableCell className="px-4 py-3">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(student)}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(student)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4 text-red-600" />
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

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="[&>button]:hidden">
            <DialogHeader>
              <DialogTitle>تعديل بيانات الطالب</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الطالب</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-class_id">الصف</Label>
                <select
                  id="edit-class_id"
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                  required
                >
                  <option value="">اختر الصف</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 relative">
                <Label htmlFor="edit-parent_search">البحث عن ولي أمر موجود (اختياري)</Label>
                <Input
                  id="edit-parent_search"
                  value={parentSearch}
                  onChange={(e) => handleParentSearchChange(e.target.value)}
                  placeholder="اكتب رقم هاتف أو اسم للبحث..."
                />
                {showParentSuggestions && parentSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg max-h-48 overflow-auto">
                    <div className="px-4 py-2 bg-gray-50 text-sm text-gray-600 border-b">اختر ولي أمر من القائمة</div>
                    {parentSuggestions.map((suggestion) => (
                      <button
                        key={suggestion.id}
                        type="button"
                        className="w-full px-4 py-2 text-right hover:bg-gray-100 border-b last:border-0"
                        onClick={() => selectParent(suggestion)}
                      >
                        <div className="font-medium">{suggestion.parent_name}</div>
                        <div className="text-sm text-gray-500">{formatPhoneNumber(suggestion.parent_phone)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent_name">اسم ولي الأمر</Label>
                <Input
                  id="edit-parent_name"
                  value={formData.parent_name}
                  onChange={(e) => setFormData({ ...formData, parent_name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent_password">كلمة المرور الجديدة</Label>
                <Input
                  id="edit-parent_password"
                  type="password"
                  value={formData.parent_password}
                  onChange={(e) => setFormData({ ...formData, parent_password: e.target.value })}
                  placeholder="اترك فارغاً إذا لم ترد التغيير"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent_phone">رقم هاتف ولي الأمر</Label>
                <Input
                  id="edit-parent_phone"
                  value={formData.parent_phone}
                  onChange={(e) => setFormData({ ...formData, parent_phone: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-parent_address">عنوان ولي الأمر</Label>
                <Input
                  id="edit-parent_address"
                  value={formData.parent_address}
                  onChange={(e) => setFormData({ ...formData, parent_address: e.target.value })}
                  placeholder="أدخل العنوان"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date_of_birth">تاريخ الميلاد</Label>
                <Input
                  id="edit-date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                  className="text-right"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-gender">الجنس</Label>
                <select
                  id="edit-gender"
                  value={formData.gender}
                  onChange={(e) => setFormData({ ...formData, gender: e.target.value as 'male' | 'female' | '' })}
                  className="w-full h-10 px-3 rounded-md border border-gray-200 bg-white text-sm"
                >
                  <option value="">اختر الجنس</option>
                  <option value="male">ذكر</option>
                  <option value="female">أنثى</option>
                </select>
              </div>
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                  حفظ التعديلات
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription dir="rtl" className="text-right">
                سيتم حذف الطالب &quot;{selectedStudent?.name}&quot; نهائياً.
                <br />
                هذا الإجراء لا يمكن التراجع عنه.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                className="bg-red-600 hover:bg-red-700"
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

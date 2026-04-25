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
import { Plus, Pencil, Trash2, Search, Users, Upload, X } from 'lucide-react';
import Cropper from 'react-easy-crop';
import Image from 'next/image';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
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
  image_url?: string;
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
  const [formData, setFormData] = useState<FormData & { parent_password?: string; parent_address?: string }>({
    name: '',
    class_id: '',
    parent_name: '',
    parent_password: '',
    parent_phone: '',
    parent_address: '',
    date_of_birth: '',
    gender: '',
    image_url: '',
  });
  const [parentSearch, setParentSearch] = useState('');
  const [parentSuggestions, setParentSuggestions] = useState<Student[]>([]);
  const [showParentSuggestions, setShowParentSuggestions] = useState(false);

  const [isExistingParent, setIsExistingParent] = useState(false);

  // Image cropper states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>('');

  // Fetch students and classes
  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await fetch('/api/students', {
        headers: getAuthHeaders(),
      });
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
      const response = await fetch('/api/classes', {
        headers: getAuthHeaders(),
      });
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
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
        headers: getAuthHeaders(),
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
    
    // Format date_of_birth to YYYY-MM-DD for HTML date input
    // Handle Date objects from API and string formats
    let formattedDate = '';
    if (student.date_of_birth) {
      const dateValue: string | Date = student.date_of_birth as any;
      
      if (typeof dateValue === 'object' && dateValue !== null && 'getTime' in dateValue) {
        // Date object from API - format as YYYY-MM-DD using local date components
        const d = dateValue as Date;
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        formattedDate = `${year}-${month}-${day}`;
      } else if (typeof dateValue === 'string') {
        if (dateValue.includes('T')) {
          // ISO timestamp string - convert to Date then get local date components
          const d = new Date(dateValue);
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          formattedDate = `${year}-${month}-${day}`;
        } else {
          // Already YYYY-MM-DD string format
          formattedDate = dateValue;
        }
      }
    }
    
    setFormData({
      name: student.name,
      class_id: student.class_id || '',
      parent_name: student.parent_name || '',
      parent_password: '',
      parent_phone: student.parent_phone || '',
      parent_address: student.parent_address || '',
      date_of_birth: formattedDate,
      gender: student.gender || '',
      image_url: (student as any).image_url || '',
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

  // Calculate new login_name (same logic as backend): Student full name only
  const calculateLoginName = (studentName: string, _parentName: string): string => {
    return studentName.trim();
  };

  // Image handling functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: {x: number, y: number, width: number, height: number}) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imagePreview || !croppedAreaPixels) return null;

    const image = new window.Image();
    image.src = imagePreview;
    await new Promise((resolve) => { image.onload = resolve; });

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    canvas.width = croppedAreaPixels.width;
    canvas.height = croppedAreaPixels.height;

    ctx.drawImage(
      image,
      croppedAreaPixels.x,
      croppedAreaPixels.y,
      croppedAreaPixels.width,
      croppedAreaPixels.height,
      0,
      0,
      croppedAreaPixels.width,
      croppedAreaPixels.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  const uploadCroppedImage = async () => {
    const blob = await createCroppedImage();
    if (!blob) return;

    // Calculate the new login_name that will be used after saving (student full name)
    const studentName = formData.name || selectedStudent?.name || 'غير_محدد';
    const newLoginName = calculateLoginName(studentName, '');

    // Build Arabic filename based on gender and the NEW login_name (same format as PUT)
    const genderLabel = formData.gender === 'female' ? 'الطالبة' : 'الطالب';
    const arabicFilename = `صورة_${genderLabel}_${newLoginName}`;

    const uploadFormData = new FormData();
    uploadFormData.append('file', blob, 'student-image.jpg');
    uploadFormData.append('type', 'student-image');
    uploadFormData.append('filename', arabicFilename);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        setIsCropping(false);
        setImageFile(null);
        setImagePreview('');
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
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
                          <div className="text-sm text-gray-500">{formatPhoneNumber(suggestion.parent_phone)}</div>
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
          <DialogContent className="[&>button]:hidden max-w-2xl max-h-[90vh] overflow-y-auto">
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

              {/* Student Image Upload */}
              <div className="space-y-2">
                <Label>صورة الطالب</Label>
                {isCropping ? (
                  <div className="relative w-full h-64 bg-gray-900 rounded-lg overflow-hidden">
                    <Cropper
                      image={imagePreview}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      cropShape="round"
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                    />
                    <div className="absolute bottom-4 left-4 right-4 flex gap-2 z-10">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setIsCropping(false);
                          setImageFile(null);
                          setImagePreview('');
                        }}
                        className="flex-1"
                      >
                        <X className="h-4 w-4 ml-1" />
                        إلغاء
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        onClick={uploadCroppedImage}
                        className="flex-1 bg-brand-primary-blue"
                      >
                        <Upload className="h-4 w-4 ml-1" />
                        تأكيد القص
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-4">
                    {formData.image_url ? (
                      <div className="relative w-24 h-24 rounded-full overflow-hidden border-2 border-gray-200">
                        <Image
                          src={formData.image_url}
                          alt="صورة الطالب"
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center">
                        <Users className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <label className="cursor-pointer inline-flex items-center">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageSelect}
                      />
                      <span className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3">
                        <Upload className="h-4 w-4 ml-1" />
                        {formData.image_url ? 'تغيير الصورة' : 'رفع صورة'}
                      </span>
                    </label>
                  </div>
                )}
                <p className="text-xs text-gray-500">
                  يمكنك قص الصورة لتناسب شكل دائري
                </p>
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

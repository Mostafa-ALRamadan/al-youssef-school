'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS } from '@/constants';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Plus, Pencil, Trash2, Search, Building } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { USER_ROLES } from '@/constants';

interface Class {
  id: string;
  name: string;
  created_at: string;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [formData, setFormData] = useState({ name: '' });

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes');
      const data = await response.json();
      if (data.classes) {
        setClasses(data.classes);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/classes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({ name: '' });
        fetchClasses();
      }
    } catch (error) {
      console.error('Error adding class:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedClass(null);
        setFormData({ name: '' });
        fetchClasses();
      }
    } catch (error) {
      console.error('Error updating class:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedClass) return;
    
    try {
      const response = await fetch(`/api/classes/${selectedClass.id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedClass(null);
        fetchClasses();
      }
    } catch (error) {
      console.error('Error deleting class:', error);
    }
  };

  const openEditDialog = (cls: Class) => {
    setSelectedClass(cls);
    setFormData({ name: cls.name });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (cls: Class) => {
    setSelectedClass(cls);
    setIsDeleteDialogOpen(true);
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Building className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold text-gray-900">إدارة الصفوف</h1>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <Button 
              className="bg-brand-primary-blue hover:bg-brand-dark-blue"
              onClick={() => setIsAddDialogOpen(true)}
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة صف
            </Button>
            <DialogContent className="[&>button]:hidden">
              <DialogHeader>
                <DialogTitle>إضافة صف جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">اسم الصف</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="مثال: الصف الأول الثانوي"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2">
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
        </div>

        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="text-center">اسم الصف</TableHead>
                  <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                  <TableHead className="text-center">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {classes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center py-8 text-gray-500">
                      لا يوجد صفوف
                    </TableCell>
                  </TableRow>
                ) : (
                  classes.map((cls) => (
                    <TableRow key={cls.id}>
                      <TableCell className="font-medium text-center">{cls.name}</TableCell>
                      <TableCell className="text-center">
                        {formatDate(cls.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(cls)}
                          >
                            <Pencil className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(cls)}
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
              <DialogTitle>تعديل الصف</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">اسم الصف</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                  حفظ التغييرات
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Alert Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl" className="text-right">
                هل أنت متأكد من حذف الصف &quot;{selectedClass?.name}&quot;؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
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
      </div>
    </DashboardLayout>
  );
}

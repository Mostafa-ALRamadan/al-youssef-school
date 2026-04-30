'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { useToast } from '@/components/ui/use-toast';
import { getAuthHeaders } from '@/lib/auth-client';
import { useUser } from '@/components/providers/UserProvider';
import { Input } from '@/components/ui/input';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Key, Users, Search, Trash2 } from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: 'admin' | 'teacher' | 'parent';
  full_name?: string;
  phone?: string;
  is_main_admin?: boolean;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'مدير',
  teacher: 'معلم',
  parent: 'ولي أمر',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800',
  teacher: 'bg-blue-100 text-blue-800',
  parent: 'bg-green-100 text-green-800',
};

export default function AdminUsersPage() {
  const { toast } = useToast();
  const { userInfo: currentUser, refreshUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    role: 'admin',
    full_name: '',
    phone: '',
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Always create admin accounts from this page
      const adminData = { ...formData, role: 'admin' };
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(adminData),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        setFormData({ email: '', password: '', role: 'admin', full_name: '', phone: '' });
        loadUsers();
        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة المستخدم',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في إضافة المستخدم',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding user:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          id: selectedUser.id,
          email: formData.email,
          is_parent_account: (selectedUser as any).is_parent_account,
        }),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedUser(null);
        loadUsers();
        // If editing own email, refresh user info in header
        if (selectedUser?.id === currentUser?.id) {
          await refreshUser();
        }
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث بيانات المستخدم',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في تحديث المستخدم',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password: newPassword,
          is_parent_account: (selectedUser as any).is_parent_account,
        }),
      });

      if (response.ok) {
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setSelectedUser(null);
        toast({
          title: 'تم بنجاح',
          description: 'تم إعادة تعيين كلمة المرور',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في إعادة تعيين كلمة المرور',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error resetting password:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  // Check if current user can edit target user
  const canEditUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // Main admin can edit anyone
    if (currentUser.is_main_admin) return true;
    
    // Normal admin can only edit themselves, teachers, and parents
    // Cannot edit other admins
    if (targetUser.role === 'admin') {
      return currentUser.id === targetUser.id;
    }
    
    return true;
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      email: user.email,
      password: '',
      role: user.role,
      full_name: user.full_name || '',
      phone: user.phone || '',
    });
    setIsEditDialogOpen(true);
  };

  const openPasswordDialog = (user: User) => {
    setSelectedUser(user);
    setNewPassword('');
    setIsPasswordDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        loadUsers(); // Refresh the list
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف المستخدم',
        });
      } else {
        const error = await response.json();
        console.error('Delete error:', error);
        toast({
          title: 'خطأ',
          description: error.message || 'فشل في حذف المستخدم',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  // Check if current user can delete target user (sub-admins only)
  const canDeleteUser = (targetUser: User): boolean => {
    if (!currentUser) return false;
    
    // Only allow deletion of sub-admins (role = 'admin' but not main admin)
    if (targetUser.role !== 'admin') return false;
    if (targetUser.is_main_admin) return false;
    
    // Cannot delete self
    if (currentUser.id === targetUser.id) return false;
    
    // Main admin can delete any sub-admin
    if (currentUser.is_main_admin) return true;
    
    // Normal admin cannot delete other admins
    return false;
  };

  const filteredUsers = users.filter((user) => {
    if (roleFilter !== 'all' && user.role !== roleFilter) return false;
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.email.toLowerCase().includes(query) ||
      user.full_name?.toLowerCase().includes(query) ||
      ROLE_LABELS[user.role].includes(query)
    );
  });

  return (
    <DashboardLayout 
      sidebarItems={ADMIN_SIDEBAR_ITEMS} 
      userRole="admin"
      isMainAdmin={currentUser?.is_main_admin}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold text-gray-900">إدارة المستخدمين</h1>
          </div>
          {currentUser?.is_main_admin && (
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-brand-primary-blue hover:bg-brand-dark-blue"
            >
              <Plus className="h-4 w-4 ml-2" />
              إضافة مستخدم
            </Button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold">{users.length}</div>
              <div className="text-sm text-gray-500">إجمالي المستخدمين</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {users.filter((u) => u.role === 'teacher').length}
              </div>
              <div className="text-sm text-gray-500">المعلمين</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {users.filter((u) => u.role === 'parent').length}
              </div>
              <div className="text-sm text-gray-500">أولياء الأمور</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="py-4 text-center">
              <div className="text-2xl font-bold text-red-600">
                {users.filter((u) => u.role === 'admin').length}
              </div>
              <div className="text-sm text-gray-500">المدراء</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="بحث بالبريد الإلكتروني أو الاسم..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-10"
            />
          </div>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="جميع الأدوار" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">جميع الأدوار</SelectItem>
              <SelectItem value="admin">مدير</SelectItem>
              <SelectItem value="teacher">معلم</SelectItem>
              <SelectItem value="parent">ولي أمر</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="text-center">البريد الإلكتروني</TableHead>
                <TableHead className="text-center">الاسم</TableHead>
                <TableHead className="text-center">الدور</TableHead>
                <TableHead className="text-center">تاريخ الإنشاء</TableHead>
                <TableHead className="text-center">الإجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    جاري التحميل...
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    لا يوجد مستخدمين
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium text-center">{user.email}</TableCell>
                    <TableCell className="text-center">{user.full_name || '-'}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-3 py-1 rounded-full text-sm ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                        {user.is_main_admin && ' 👑'}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      {new Date(user.created_at).toLocaleDateString('ar-SA')}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        {canEditUser(user) && (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(user)}
                              title="تعديل"
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPasswordDialog(user)}
                              title="تغيير كلمة المرور"
                            >
                              <Key className="h-4 w-4 text-orange-600" />
                            </Button>
                          </>
                        )}
                        {canDeleteUser(user) && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(user)}
                            title="حذف"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>إضافة مستخدم جديد</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAdd} className="space-y-4 mt-4">
            <div className="bg-blue-50 p-3 rounded text-sm text-blue-700 mb-4">
              إنشاء حساب مدير جديد فقط. لإضافة معلم أو ولي أمر، استخدم صفحة المعلمين أو أولياء الأمور.
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">كلمة المرور *</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                إضافة مدير
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>تعديل المستخدم</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEdit} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="edit-email">البريد الإلكتروني الجديد</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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

      {/* Reset Password Dialog */}
      <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
        <DialogContent className="[&>button]:hidden">
          <DialogHeader>
            <DialogTitle>تغيير كلمة المرور</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePasswordReset} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>المستخدم</Label>
              <p className="text-sm text-gray-600">{selectedUser?.email}</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">كلمة المرور الجديدة *</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsPasswordDialogOpen(false)}>
                إلغاء
              </Button>
              <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                تحديث كلمة المرور
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
            <AlertDialogDescription dir="rtl" className="text-right">
              هل أنت متأكد من حذف المستخدم &quot;{selectedUser?.full_name || selectedUser?.email}&quot;؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DashboardLayout>
  );
}

// Card component for stats
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white rounded-lg border shadow-sm">{children}</div>;
}

function CardContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

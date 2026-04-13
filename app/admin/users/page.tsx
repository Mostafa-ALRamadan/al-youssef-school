'use client';

import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { useToast } from '@/components/ui/use-toast';
import { createClient } from '@/lib/supabase';
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
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Plus, Pencil, Key, Users, Search } from 'lucide-react';

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
  const { userInfo: currentUser, refreshUser } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
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
      }
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      // Get session token for authorization
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({
          id: selectedUser.id,
          email: formData.email,
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
      }
    } catch (error) {
      console.error('Error updating user:', error);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const response = await fetch(`/api/admin/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: newPassword }),
      });

      if (response.ok) {
        setIsPasswordDialogOpen(false);
        setNewPassword('');
        setSelectedUser(null);
      }
    } catch (error) {
      console.error('Error resetting password:', error);
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
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-brand-primary-blue hover:bg-brand-dark-blue"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة مستخدم
          </Button>
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

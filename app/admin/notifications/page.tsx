'use client';

import { useEffect, useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import { MainAdminGuard } from '@/components/auth/MainAdminGuard';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import { Trash2, AlertTriangle, Search, RefreshCw, CheckSquare, Bell } from 'lucide-react';
import { formatDate } from '@/utils/date';
import { formatNumber } from '@/utils/number';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
  parent_name?: string;
}

export default function NotificationsAdminPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deletingBulk, setDeletingBulk] = useState(false);
  const [showClearAllDialog, setShowClearAllDialog] = useState(false);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/admin/notifications', { headers: getAuthHeaders() });
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteNotification = async (id: string) => {
    setNotificationToDelete(id);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!notificationToDelete) return;

    setDeletingId(notificationToDelete);
    try {
      const response = await fetch(`/api/admin/notifications/${notificationToDelete}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setNotifications(prev => prev.filter(n => n.id !== notificationToDelete));
        setShowDeleteDialog(false);
        setNotificationToDelete(null);
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredNotifications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredNotifications.map(n => n.id)));
    }
  };

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const deleteSelected = async () => {
    setDeletingBulk(true);
    try {
      const promises = Array.from(selectedIds).map(id =>
        fetch(`/api/admin/notifications/${id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notifications:', error);
    } finally {
      setDeletingBulk(false);
      setShowBulkDeleteDialog(false);
    }
  };

  const clearAllNotifications = async () => {
    setDeletingBulk(true);
    try {
      // Delete all notifications one by one
      const promises = notifications.map(n =>
        fetch(`/api/admin/notifications/${n.id}`, {
          method: 'DELETE',
          headers: getAuthHeaders(),
        })
      );
      await Promise.all(promises);
      setSelectedIds(new Set());
      fetchNotifications();
    } catch (error) {
      console.error('Error clearing notifications:', error);
    } finally {
      setDeletingBulk(false);
      setShowClearAllDialog(false);
    }
  };

  const filteredNotifications = notifications.filter(n =>
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <MainAdminGuard>
        <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
          <div className="p-8 text-center">جاري التحميل...</div>
        </DashboardLayout>
      </MainAdminGuard>
    );
  }

  return (
    <MainAdminGuard>
      <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
        <div className="space-y-6 p-6" dir="rtl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="h-8 w-8 text-brand-primary-blue" />
              <h1 className="text-2xl font-bold">إدارة الإشعارات</h1>
            </div>
            <Button
              variant="outline"
              onClick={fetchNotifications}
              disabled={loading}
            >
              <RefreshCw className="w-4 h-4 ml-2" />
              تحديث
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="border-l-4 border-l-gray-400">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">إجمالي الإشعارات</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatNumber(notifications.length)}</div>
                <p className="text-xs text-muted-foreground">إشعار</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">غير مقروءة</CardTitle>
                <Bell className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(notifications.filter(n => !n.is_read).length)}
                </div>
                <p className="text-xs text-muted-foreground">إشعار جديد</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">مقروءة</CardTitle>
                <CheckSquare className="h-4 w-4 text-green-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber(notifications.filter(n => n.is_read).length)}
                </div>
                <p className="text-xs text-muted-foreground">تمت قراءتها</p>
              </CardContent>
            </Card>
            <Card className="border-l-4 border-l-red-500">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">حذف الكل</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <Button
                  variant="destructive"
                  onClick={() => setShowClearAllDialog(true)}
                  disabled={notifications.length === 0 || deletingBulk}
                  className="w-full"
                  size="sm"
                >
                  حذف جميع الإشعارات
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Search & Bulk Actions */}
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <Input
                placeholder="البحث في الإشعارات..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            {selectedIds.size > 0 && (
              <Button
                variant="destructive"
                onClick={() => setShowBulkDeleteDialog(true)}
                disabled={deletingBulk}
              >
                <Trash2 className="w-4 h-4 ml-2" />
                حذف المحدد ({formatNumber(selectedIds.size)})
              </Button>
            )}
          </div>

          {/* Notifications Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Checkbox
                  checked={filteredNotifications.length > 0 && selectedIds.size === filteredNotifications.length}
                  onCheckedChange={toggleSelectAll}
                />
                <span>الإشعارات ({formatNumber(filteredNotifications.length)})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[600px] overflow-y-auto">
                {filteredNotifications.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    لا توجد إشعارات
                  </div>
                ) : (
                  filteredNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg flex items-start gap-3 ${
                        notification.is_read ? 'bg-gray-50' : 'bg-blue-50 border-blue-200'
                      }`}
                    >
                      <Checkbox
                        checked={selectedIds.has(notification.id)}
                        onCheckedChange={() => toggleSelect(notification.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="font-semibold">{notification.title}</span>
                          {!notification.is_read && (
                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs rounded">
                              جديد
                            </span>
                          )}
                          <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                            {notification.type}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-1">{notification.message}</p>
                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <span>{formatDate(notification.created_at)}</span>
                          {notification.parent_name && (
                            <span>• {notification.parent_name}</span>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotification(notification.id)}
                        disabled={deletingId === notification.id}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Clear All Confirmation Dialog */}
          <AlertDialog open={showClearAllDialog} onOpenChange={setShowClearAllDialog}>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  تأكيد حذف جميع الإشعارات
                </AlertDialogTitle>
                <AlertDialogDescription dir="rtl" className="text-right">
                  سيتم حذف <strong>{formatNumber(notifications.length)}</strong> إشعار نهائياً. 
                  هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
                <AlertDialogAction
                  onClick={clearAllNotifications}
                  disabled={deletingBulk}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deletingBulk ? 'جاري الحذف...' : 'نعم، حذف الكل'}
                </AlertDialogAction>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Bulk Delete Confirmation Dialog */}
          <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                  تأكيد حذف الإشعارات المحددة
                </AlertDialogTitle>
                <AlertDialogDescription dir="rtl" className="text-right">
                  سيتم حذف <strong>{formatNumber(selectedIds.size)}</strong> إشعار محدد نهائياً.
                  هذا الإجراء لا يمكن التراجع عنه.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
                <AlertDialogAction
                  onClick={deleteSelected}
                  disabled={deletingBulk}
                  className="bg-red-500 hover:bg-red-600"
                >
                  {deletingBulk ? 'جاري الحذف...' : 'نعم، حذف المحدد'}
                </AlertDialogAction>
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Single Delete Confirmation Dialog */}
          <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription dir="rtl" className="text-right">
                  هل أنت متأكد من حذف هذا الإشعار؟
                  <br />
                  لا يمكن التراجع عن هذا الإجراء.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
                <AlertDialogCancel>إلغاء</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  حذف
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </DashboardLayout>
    </MainAdminGuard>
  );
}

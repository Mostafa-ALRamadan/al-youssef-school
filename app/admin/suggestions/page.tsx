'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Lightbulb, Trash2, MessageSquare, Reply, Eye } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { createClient } from '@/lib/supabase';
import type { Suggestion } from '@/types';
import { formatDate } from '@/utils/date';

export default function AdminSuggestionsPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, []);

  const loadSuggestions = async () => {
    try {
      const response = await fetch('/api/suggestions');
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      }
    } catch (error) {
      console.error('Error loading suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: Suggestion['status']) => {
    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم تحديث حالة الاقتراح',
        });
        loadSuggestions();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في تحديث الحالة',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الاقتراح؟')) return;

    try {
      const response = await fetch(`/api/suggestions/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الاقتراح',
        });
        loadSuggestions();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في الحذف',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending': return 'معلق';
      case 'reviewed': return 'تم المراجعة';
      case 'implemented': return 'تم التنفيذ';
      case 'rejected': return 'مرفوض';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'reviewed': return 'bg-blue-100 text-blue-800';
      case 'implemented': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleReply = async () => {
    if (!selectedSuggestion || !replyText.trim()) return;

    setSubmittingReply(true);
    try {
      const response = await fetch(`/api/suggestions/${selectedSuggestion.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reply: replyText.trim() }),
      });

      if (response.ok) {
        toast({
          title: 'تم بنجاح',
          description: 'تم إضافة الرد بنجاح',
        });
        setReplyDialogOpen(false);
        setReplyText('');
        setSelectedSuggestion(null);
        loadSuggestions();
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في إضافة الرد',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error adding reply:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إضافة الرد',
        variant: 'destructive',
      });
    } finally {
      setSubmittingReply(false);
    }
  };

  const openReplyDialog = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setReplyText(suggestion.reply || '');
    setReplyDialogOpen(true);
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-brand-primary-blue" />
          <h1 className="text-2xl font-bold">الاقتراحات</h1>
        </div>

        {/* Suggestions List */}
        {loading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                قائمة الاقتراحات
              </CardTitle>
            </CardHeader>
            <CardContent>
              {suggestions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  لا توجد اقتراحات
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العنوان</TableHead>
                      <TableHead className="text-right">الرسالة</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                      <TableHead className="text-right">تاريخ الإرسال</TableHead>
                      <TableHead className="text-right">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suggestions.map((suggestion) => (
                      <TableRow key={suggestion.id}>
                        <TableCell className="font-medium">{suggestion.title}</TableCell>
                        <TableCell className="max-w-md truncate">{suggestion.message}</TableCell>
                        <TableCell>
                          <Select
                            value={suggestion.status}
                            onValueChange={(value) => handleStatusChange(suggestion.id, value as Suggestion['status'])}
                          >
                            <SelectTrigger dir="rtl" className="w-32">
                              <SelectValue>
                                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(suggestion.status)}`}>
                                  {getStatusLabel(suggestion.status)}
                                </span>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="pending">معلق</SelectItem>
                              <SelectItem value="reviewed">تم المراجعة</SelectItem>
                              <SelectItem value="implemented">تم التنفيذ</SelectItem>
                              <SelectItem value="rejected">مرفوض</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          {formatDate(suggestion.created_at)}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openReplyDialog(suggestion)}
                              title={suggestion.reply ? 'عرض/تعديل الرد' : 'إضافة رد'}
                            >
                              <Reply className={`h-4 w-4 ${suggestion.reply ? 'text-green-600' : 'text-blue-600'}`} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(suggestion.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reply Dialog */}
        <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
          <DialogContent className="max-w-lg [&>button]:hidden" dir="rtl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Reply className="h-5 w-5" />
                {selectedSuggestion?.reply ? 'تعديل الرد' : 'إضافة رد'}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {selectedSuggestion && (
                <>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">الاقتراح:</p>
                    <p className="font-medium">{selectedSuggestion.title}</p>
                    <p className="text-sm text-gray-600 mt-1">{selectedSuggestion.message}</p>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium block mb-2">الرد:</label>
                    <textarea
                      value={replyText}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setReplyText(e.target.value)}
                      placeholder="اكتب ردك هنا..."
                      rows={4}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary-blue"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setReplyDialogOpen(false)}
                      disabled={submittingReply}
                    >
                      إلغاء
                    </Button>
                    <Button
                      onClick={handleReply}
                      disabled={!replyText.trim() || submittingReply}
                      className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                    >
                      {submittingReply ? 'جاري الإرسال...' : (selectedSuggestion.reply ? 'تحديث الرد' : 'إرسال الرد')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}

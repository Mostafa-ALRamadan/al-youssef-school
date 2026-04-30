'use client';

import * as React from 'react';
import { useState, useEffect } from 'react';
import { formatDateTimeRTL } from '@/utils/date';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Pencil, Trash2, Video, Ticket, Save, Copy, CheckCircle, XCircle, Clock } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { MainAdminGuard } from '@/components/auth/MainAdminGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import { Badge } from '@/components/ui/badge';

// Types
type Settings = {
  about_video_url: string | null;
};

type VideoItem = {
  id: string;
  title: string;
  description: string | null;
  youtube_url: string;
  class_id: string;
  class_name: string | null;
  created_at: string;
};

type AccessCode = {
  id: string;
  code: string;
  class_id: string | null;
  class_name: string | null;
  is_used: boolean;
  expires_at: string | null;
  created_at: string;
  used_by_student_name: string | null;
  used_by_parent_name: string | null;
};

type Class = {
  id: string;
  name: string;
};

// Simple tabs implementation
function SimpleTabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const [activeTab, setActiveTab] = useState(defaultValue);
  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="space-y-6">{children}</div>
    </TabsContext.Provider>
  );
}

const TabsContext = React.createContext<{ activeTab: string; setActiveTab: (tab: string) => void }>({
  activeTab: '',
  setActiveTab: () => {},
});

function useTabs() {
  return React.useContext(TabsContext);
}

function SimpleTabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid w-full grid-cols-3 lg:w-[400px] bg-muted p-1 rounded-lg">
      {children}
    </div>
  );
}

function SimpleTabsTrigger({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab, setActiveTab } = useTabs();
  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all ${
        activeTab === value ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'
      }`}
    >
      {children}
    </button>
  );
}

function SimpleTabsContent({ value, children }: { value: string; children: React.ReactNode }) {
  const { activeTab } = useTabs();
  if (activeTab !== value) return null;
  return <div className="mt-2">{children}</div>;
}

export default function DigitalContentPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('about');
  
  // Settings state
  const [settings, setSettings] = useState<Settings>({ about_video_url: null });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);

  // Videos state
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [videosLoading, setVideosLoading] = useState(true);
  const [isVideoDialogOpen, setIsVideoDialogOpen] = useState(false);
  const [isVideoDeleteDialogOpen, setIsVideoDeleteDialogOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    youtube_url: '',
    class_id: '',
  });

  // Access codes state
  const [codes, setCodes] = useState<AccessCode[]>([]);
  const [codesLoading, setCodesLoading] = useState(true);
  const [isCodeDeleteDialogOpen, setIsCodeDeleteDialogOpen] = useState(false);
  const [selectedCode, setSelectedCode] = useState<AccessCode | null>(null);
  const [codeCount, setCodeCount] = useState(1);
  const [codeClassId, setCodeClassId] = useState('');
  const [codeExpiresAt, setCodeExpiresAt] = useState('');

  // Classes
  const [classes, setClasses] = useState<Class[]>([]);

  // Helper function to convert YouTube URL to embed URL
  const getYouTubeEmbedUrl = (url: string) => {
    if (!url) return '';
    // Extract video ID from various YouTube URL formats
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://www.youtube.com/embed/${match[2]}`;
    }
    return url;
  };

  // Fetch all data
  useEffect(() => {
    fetchSettings();
    fetchVideos();
    fetchCodes();
    fetchClasses();
  }, []);

  // Settings functions
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSaveSettings = async () => {
    setSettingsLoading(true);
    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ about_video_url: settings.about_video_url }),
      });
      if (response.ok) {
        setSettingsSaved(true);
        setTimeout(() => setSettingsSaved(false), 2000);
        toast({
          title: 'تم بنجاح',
          description: 'تم حفظ الإعدادات',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في حفظ الإعدادات',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
    setSettingsLoading(false);
  };

  // Videos functions
  const fetchVideos = async () => {
    setVideosLoading(true);
    try {
      const response = await fetch('/api/premium-videos', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setVideos(data.videos || []);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
    setVideosLoading(false);
  };

  const handleAddVideo = () => {
    setSelectedVideo(null);
    setVideoFormData({
      title: '',
      description: '',
      youtube_url: '',
      class_id: '',
    });
    setIsVideoDialogOpen(true);
  };

  const handleEditVideo = (video: VideoItem) => {
    setSelectedVideo(video);
    setVideoFormData({
      title: video.title,
      description: video.description || '',
      youtube_url: video.youtube_url,
      class_id: video.class_id,
    });
    setIsVideoDialogOpen(true);
  };

  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = selectedVideo
        ? `/api/premium-videos/${selectedVideo.id}`
        : '/api/premium-videos';
      const method = selectedVideo ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(videoFormData),
      });

      if (response.ok) {
        setIsVideoDialogOpen(false);
        fetchVideos();
        toast({
          title: 'تم بنجاح',
          description: selectedVideo ? 'تم تحديث الفيديو' : 'تم إضافة الفيديو',
        });
      } else {
        toast({
          title: 'خطأ',
          description: selectedVideo ? 'فشل في تحديث الفيديو' : 'فشل في إضافة الفيديو',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error saving video:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteVideo = async () => {
    if (!selectedVideo) return;
    try {
      const response = await fetch(`/api/premium-videos/${selectedVideo.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setIsVideoDeleteDialogOpen(false);
        fetchVideos();
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف الفيديو',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في حذف الفيديو',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting video:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  // Access codes functions
  const fetchCodes = async () => {
    setCodesLoading(true);
    try {
      const response = await fetch('/api/access-codes', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setCodes(data.codes || []);
      }
    } catch (error) {
      console.error('Error fetching codes:', error);
    }
    setCodesLoading(false);
  };

  const fetchClasses = async () => {
    try {
      const response = await fetch('/api/classes', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setClasses(data.classes || []);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const handleGenerateCodes = async () => {
    if (!codeClassId) return;
    try {
      const response = await fetch('/api/access-codes', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          count: codeCount,
          class_id: codeClassId,
          expires_at: codeExpiresAt || null,
        }),
      });
      if (response.ok) {
        fetchCodes();
        setCodeCount(1);
        setCodeClassId('');
        setCodeExpiresAt('');
        toast({
          title: 'تم بنجاح',
          description: 'تم إنشاء رموز الوصول',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في إنشاء رموز الوصول',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error generating codes:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteCode = async () => {
    if (!selectedCode) return;
    try {
      const response = await fetch(`/api/access-codes/${selectedCode.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        setIsCodeDeleteDialogOpen(false);
        fetchCodes();
        toast({
          title: 'تم بنجاح',
          description: 'تم حذف رمز الوصول',
        });
      } else {
        toast({
          title: 'خطأ',
          description: 'فشل في حذف رمز الوصول',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting code:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ غير متوقع',
        variant: 'destructive',
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getCodeStatus = (code: AccessCode) => {
    if (code.is_used) return { label: 'مستخدم', color: 'bg-green-100 text-green-800', icon: CheckCircle };
    if (code.expires_at && new Date(code.expires_at) < new Date()) {
      return { label: 'منتهي', color: 'bg-red-100 text-red-800', icon: XCircle };
    }
    return { label: 'متاح', color: 'bg-blue-100 text-blue-800', icon: Clock };
  };

  return (
    <MainAdminGuard>
      <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Video className="h-8 w-8 text-brand-primary-blue" />
              <h1 className="text-2xl font-bold text-gray-900">المحتوى الرقمي</h1>
            </div>
          </div>

        <SimpleTabs defaultValue="about">
          <SimpleTabsList>
            <SimpleTabsTrigger value="about">فيديو من نحن</SimpleTabsTrigger>
            <SimpleTabsTrigger value="videos">فيديوهات تعليمية</SimpleTabsTrigger>
            <SimpleTabsTrigger value="codes">أكواد الوصول</SimpleTabsTrigger>
          </SimpleTabsList>

          {/* About Us Video Section */}
          <SimpleTabsContent value="about">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  فيديو &quot;من نحن&quot;
                </CardTitle>
                <CardDescription>
                  رابط فيديو YouTube الذي سيظهر في قسم &quot;من نحن&quot; داخل تطبيق الجوال
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="youtube-url">رابط YouTube</Label>
                  <Input
                    id="youtube-url"
                    placeholder="https://www.youtube.com/watch?v=..."
                    value={settings.about_video_url || ''}
                    onChange={(e) => setSettings({ ...settings, about_video_url: e.target.value })}
                  />
                  {settings.about_video_url && (
                    <div className="aspect-video w-full max-w-2xl">
                      <iframe
                        src={getYouTubeEmbedUrl(settings.about_video_url)}
                        className="w-full h-full rounded-lg"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  )}
                </div>
                <Button
                  onClick={handleSaveSettings}
                  disabled={settingsLoading}
                  className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {settingsLoading ? 'جاري الحفظ...' : settingsSaved ? 'تم الحفظ!' : 'حفظ الرابط'}
                </Button>
              </CardContent>
            </Card>
          </SimpleTabsContent>

          {/* Premium Videos Section */}
          <SimpleTabsContent value="videos">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">الفيديوهات التعليمية</h2>
                <Button onClick={handleAddVideo} className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                  <Plus className="h-4 w-4 mr-2" />
                  إضافة فيديو
                </Button>
              </div>

              {videosLoading ? (
                <div className="text-center py-8">جاري التحميل...</div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  لا توجد فيديوهات. اضغط على &quot;إضافة فيديو&quot; لإضافة أول فيديو.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {videos.map((video) => (
                    <Card key={video.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg line-clamp-1">{video.title}</CardTitle>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEditVideo(video)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedVideo(video);
                                setIsVideoDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        </div>
                        <Badge variant="secondary">{video.class_name || 'غير محدد'}</Badge>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {video.description || 'بدون وصف'}
                        </p>
                        <div className="text-xs text-muted-foreground truncate">
                          {video.youtube_url}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </SimpleTabsContent>

          {/* Access Codes Section */}
          <SimpleTabsContent value="codes">
            <div className="space-y-6">
              {/* Generate Codes */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Ticket className="h-5 w-5" />
                    توليد أكواد جديدة
                  </CardTitle>
                  <CardDescription>
                    قم بتوليد أكواد وصول جديدة للطلاب
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>الصف</Label>
                      <Select value={codeClassId} onValueChange={setCodeClassId}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر الصف" />
                        </SelectTrigger>
                        <SelectContent>
                          {classes.map((cls) => (
                            <SelectItem key={cls.id} value={cls.id}>
                              {cls.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>عدد الأكواد</Label>
                      <Input
                        type="number"
                        min={1}
                        max={100}
                        value={codeCount}
                        onChange={(e) => setCodeCount(parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>تاريخ انتهاء الصلاحية (اختياري)</Label>
                      <Input
                        type="datetime-local"
                        value={codeExpiresAt}
                        onChange={(e) => setCodeExpiresAt(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleGenerateCodes}
                    disabled={!codeClassId}
                    className="bg-brand-primary-blue hover:bg-brand-dark-blue"
                  >
                    <Ticket className="h-4 w-4 mr-2" />
                    توليد الأكواد
                  </Button>
                </CardContent>
              </Card>

              {/* Codes List */}
              <div>
                <h3 className="text-lg font-semibold mb-4">قائمة الأكواد</h3>
                {codesLoading ? (
                  <div className="text-center py-8">جاري التحميل...</div>
                ) : codes.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    لا توجد أكواد. قم بتوليد أكواد جديدة أولاً.
                  </div>
                ) : (
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="text-right">الكود</TableHead>
                          <TableHead className="text-right">الصف</TableHead>
                          <TableHead className="text-right">الحالة</TableHead>
                          <TableHead className="text-right">مستخدم بواسطة</TableHead>
                          <TableHead className="text-right">تاريخ الانتهاء</TableHead>
                          <TableHead className="text-right">الإجراءات</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {codes.map((code) => {
                          const status = getCodeStatus(code);
                          const StatusIcon = status.icon;
                          return (
                            <TableRow key={code.id}>
                              <TableCell className="font-mono text-base font-medium">
                                <div className="flex items-center gap-2">
                                  {code.code}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => copyToClipboard(code.code)}
                                  >
                                    <Copy className="h-3 w-3" />
                                  </Button>
                                </div>
                              </TableCell>
                              <TableCell>{code.class_name || '-'}</TableCell>
                              <TableCell>
                                <Badge className={status.color}>
                                  <StatusIcon className="h-3 w-3 ml-1" />
                                  {status.label}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {code.used_by_student_name ? (
                                  <div className="text-sm">
                                    <div>{code.used_by_student_name}</div>
                                    <div className="text-muted-foreground">({code.used_by_parent_name})</div>
                                  </div>
                                ) : (
                                  '-'
                                )}
                              </TableCell>
                              <TableCell>
                                {code.expires_at
                                  ? formatDateTimeRTL(code.expires_at)
                                  : 'لا يوجد'}
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedCode(code);
                                    setIsCodeDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </SimpleTabsContent>
        </SimpleTabs>

        {/* Video Dialog */}
        <Dialog open={isVideoDialogOpen} onOpenChange={setIsVideoDialogOpen}>
          <DialogContent className="sm:max-w-[500px] [&>button]:hidden">
            <DialogHeader>
              <DialogTitle>
                {selectedVideo ? 'تعديل الفيديو' : 'إضافة فيديو جديد'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSaveVideo} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>عنوان الفيديو *</Label>
                <Input
                  value={videoFormData.title}
                  onChange={(e) => setVideoFormData({ ...videoFormData, title: e.target.value })}
                  placeholder="عنوان الفيديو..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>الوصف</Label>
                <Textarea
                  value={videoFormData.description}
                  onChange={(e) => setVideoFormData({ ...videoFormData, description: e.target.value })}
                  placeholder="وصف الفيديو..."
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label>رابط YouTube *</Label>
                <Input
                  value={videoFormData.youtube_url}
                  onChange={(e) => setVideoFormData({ ...videoFormData, youtube_url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                  required
                />
                {videoFormData.youtube_url && (
                  <div className="aspect-video w-full">
                    <iframe
                      src={getYouTubeEmbedUrl(videoFormData.youtube_url)}
                      className="w-full h-full rounded-lg"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>الصف *</Label>
                <Select
                  value={videoFormData.class_id}
                  onValueChange={(value) => setVideoFormData({ ...videoFormData, class_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsVideoDialogOpen(false)}>
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                  {selectedVideo ? 'حفظ التغييرات' : 'إضافة'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Video Delete Alert */}
        <AlertDialog open={isVideoDeleteDialogOpen} onOpenChange={setIsVideoDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl" className="text-right">
                هل أنت متأكد من حذف هذا الفيديو؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteVideo}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                حذف
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Code Delete Alert */}
        <AlertDialog open={isCodeDeleteDialogOpen} onOpenChange={setIsCodeDeleteDialogOpen}>
          <AlertDialogContent dir="rtl">
            <AlertDialogHeader>
              <AlertDialogTitle>تأكيد الحذف</AlertDialogTitle>
              <AlertDialogDescription dir="rtl" className="text-right">
                هل أنت متأكد من حذف كود الوصول هذا؟
                <br />
                لا يمكن التراجع عن هذا الإجراء.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex-row-reverse justify-start gap-2">
              <AlertDialogCancel>إلغاء</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteCode}
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

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
import { Textarea } from '@/components/ui/textarea';
import { Plus, Pencil, Trash2, Eye, EyeOff, Pin, PinOff, Upload, X, Newspaper, Image as ImageIcon, Video } from 'lucide-react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Cropper from 'react-easy-crop';
import { ADMIN_SIDEBAR_ITEMS, USER_ROLES } from '@/constants';
import { getAuthHeaders } from '@/lib/auth-client';
import Image from 'next/image';
import { formatDate } from '@/utils/date';

type News = {
  id: string;
  title: string;
  summary: string | null;
  content: string;
  image_url: string | null;
  video_url: string | null;
  is_published: boolean;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
};

export default function NewsPage() {
  const [news, setNews] = useState<News[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedNews, setSelectedNews] = useState<News | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');

  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    image_url: '',
    video_url: '',
    is_published: true,
    is_pinned: false,
  });
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');

  // Image cropper states
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<{x: number, y: number, width: number, height: number} | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [imagePreviewForCrop, setImagePreviewForCrop] = useState('');

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    try {
      const response = await fetch('/api/news', {
        headers: getAuthHeaders(),
      });
      if (response.ok) {
        const data = await response.json();
        setNews(data.news || []);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      summary: '',
      content: '',
      image_url: '',
      video_url: '',
      is_published: true,
      is_pinned: false,
    });
    setMediaType('image');
    setImageFile(null);
    setImagePreview('');
    setIsCropping(false);
    setImagePreviewForCrop('');
    setCrop({ x: 0, y: 0 });
    setZoom(1);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

  const openEditDialog = (newsItem: News) => {
    setSelectedNews(newsItem);
    setFormData({
      title: newsItem.title,
      summary: newsItem.summary || '',
      content: newsItem.content,
      image_url: newsItem.image_url || '',
      video_url: newsItem.video_url || '',
      is_published: newsItem.is_published,
      is_pinned: newsItem.is_pinned,
    });
    setImagePreview(newsItem.image_url || '');
    setMediaType(newsItem.video_url ? 'video' : 'image');
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (newsItem: News) => {
    setSelectedNews(newsItem);
    setIsDeleteDialogOpen(true);
  };

  // Image cropping functions
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviewForCrop(reader.result as string);
        setIsCropping(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: {x: number, y: number, width: number, height: number}) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const createCroppedImage = async (): Promise<Blob | null> => {
    if (!imagePreviewForCrop || !croppedAreaPixels) return null;

    const image = new window.Image();
    image.src = imagePreviewForCrop;
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

    const uploadFormData = new FormData();
    uploadFormData.append('file', blob, 'news-image.jpg');
    uploadFormData.append('type', 'news');
    uploadFormData.append('filename', formData.title || 'news-image');

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, image_url: data.url }));
        setIsCropping(false);
        setImageFile(null);
        setImagePreviewForCrop('');
      }
    } catch (error) {
      console.error('Upload error:', error);
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setFormData(prev => ({ ...prev, image_url: '' }));
  };

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

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch('/api/news', {
        method: 'POST',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsAddDialogOpen(false);
        resetForm();
        fetchNews();
      }
    } catch (error) {
      console.error('Error adding news:', error);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedNews) return;

    try {
      const response = await fetch(`/api/news/${selectedNews.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        setSelectedNews(null);
        resetForm();
        fetchNews();
      }
    } catch (error) {
      console.error('Error updating news:', error);
    }
  };

  const handleDelete = async () => {
    if (!selectedNews) return;

    try {
      const response = await fetch(`/api/news/${selectedNews.id}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedNews(null);
        fetchNews();
      }
    } catch (error) {
      console.error('Error deleting news:', error);
    }
  };

  const togglePublish = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_published: !newsItem.is_published }),
      });

      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error('Error toggling publish:', error);
    }
  };

  const togglePin = async (newsItem: News) => {
    try {
      const response = await fetch(`/api/news/${newsItem.id}`, {
        method: 'PUT',
        headers: {
          ...getAuthHeaders(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_pinned: !newsItem.is_pinned }),
      });

      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  };

  return (
    <DashboardLayout sidebarItems={ADMIN_SIDEBAR_ITEMS} userRole={USER_ROLES.ADMIN}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold text-gray-900">أخبار المدرسة</h1>
          </div>
          <Button
            onClick={openAddDialog}
            className="bg-brand-primary-blue hover:bg-brand-dark-blue"
          >
            <Plus className="h-4 w-4 ml-2" />
            إضافة خبر جديد
          </Button>
        </div>

        {isLoading ? (
          <div className="text-center py-8">جاري التحميل...</div>
        ) : (
          <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">العنوان</TableHead>
                  <TableHead className="text-right">تاريخ النشر</TableHead>
                  <TableHead className="text-right">الحالة</TableHead>
                  <TableHead className="text-right">الإجراءات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {news.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        {item.is_pinned && (
                          <Pin className="h-4 w-4 text-brand-primary-blue" />
                        )}
                        <span>{item.title}</span>
                      </div>
                    </TableCell>
                    <TableCell>{item.created_at ? formatDate(item.created_at) : '-'}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          item.is_published
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {item.is_published ? 'منشور' : 'مسودة'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePin(item)}
                          title={item.is_pinned ? 'إلغاء التثبيت' : 'تثبيت'}
                        >
                          {item.is_pinned ? (
                            <PinOff className="h-4 w-4 text-brand-primary-blue" />
                          ) : (
                            <Pin className="h-4 w-4 text-gray-400" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => togglePublish(item)}
                          title={item.is_published ? 'إخفاء' : 'نشر'}
                        >
                          {item.is_published ? (
                            <EyeOff className="h-4 w-4 text-gray-400" />
                          ) : (
                            <Eye className="h-4 w-4 text-green-600" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Add Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
            <DialogHeader>
              <DialogTitle>إضافة خبر جديد</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">العنوان</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="أدخل عنوان الخبر"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="summary">الوصف المختصر</Label>
                <Textarea
                  id="summary"
                  value={formData.summary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, summary: e.target.value })}
                  placeholder="وصف مختصر للخبر (يظهر في قائمة الأخبار)"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="content">المحتوى الكامل</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="المحتوى الكامل للخبر"
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الوسائط (صورة أو فيديو)</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={mediaType === 'image' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMediaType('image');
                      setFormData(prev => ({ ...prev, video_url: '' }));
                    }}
                    className={mediaType === 'image' ? 'bg-brand-primary-blue' : ''}
                  >
                    <ImageIcon className="h-4 w-4 ml-1" />
                    صورة
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMediaType('video');
                      setFormData(prev => ({ ...prev, image_url: '' }));
                      setImagePreview('');
                    }}
                    className={mediaType === 'video' ? 'bg-brand-primary-blue' : ''}
                  >
                    <Video className="h-4 w-4 ml-1" />
                    فيديو
                  </Button>
                </div>

                {mediaType === 'image' ? (
                  <div className="flex items-center gap-4">
                    {isCropping ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="relative w-full h-64">
                          <Cropper
                            image={imagePreviewForCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCropping(false);
                              setImageFile(null);
                              setImagePreviewForCrop('');
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
                    ) : formData.image_url ? (
                      <div className="relative w-32 h-32">
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">رفع صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="رابط فيديو يوتيوب"
                      dir="ltr"
                    />
                    {formData.video_url && (
                      <div className="aspect-video w-full max-w-md">
                        <iframe
                          src={getYouTubeEmbedUrl(formData.video_url)}
                          className="w-full h-full rounded-lg"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>نشر مباشرة</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>تثبيت في الأعلى</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue">
                  إضافة
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
            <DialogHeader>
              <DialogTitle>تعديل الخبر</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">العنوان</Label>
                <Input
                  id="edit-title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-summary">الوصف المختصر</Label>
                <Textarea
                  id="edit-summary"
                  value={formData.summary}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, summary: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-content">المحتوى الكامل</Label>
                <Textarea
                  id="edit-content"
                  value={formData.content}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setFormData({ ...formData, content: e.target.value })}
                  rows={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>الوسائط (صورة أو فيديو)</Label>
                <div className="flex gap-2 mb-2">
                  <Button
                    type="button"
                    variant={mediaType === 'image' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMediaType('image');
                      setFormData(prev => ({ ...prev, video_url: '' }));
                    }}
                    className={mediaType === 'image' ? 'bg-brand-primary-blue' : ''}
                  >
                    <ImageIcon className="h-4 w-4 ml-1" />
                    صورة
                  </Button>
                  <Button
                    type="button"
                    variant={mediaType === 'video' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setMediaType('video');
                      setFormData(prev => ({ ...prev, image_url: '' }));
                      setImagePreview('');
                    }}
                    className={mediaType === 'video' ? 'bg-brand-primary-blue' : ''}
                  >
                    <Video className="h-4 w-4 ml-1" />
                    فيديو
                  </Button>
                </div>

                {mediaType === 'image' ? (
                  <div className="flex items-center gap-4">
                    {isCropping ? (
                      <div className="flex flex-col items-center gap-2 w-full">
                        <div className="relative w-full h-64">
                          <Cropper
                            image={imagePreviewForCrop}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onZoomChange={setZoom}
                            onCropComplete={onCropComplete}
                          />
                        </div>
                        <div className="flex gap-2 w-full">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setIsCropping(false);
                              setImageFile(null);
                              setImagePreviewForCrop('');
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
                    ) : formData.image_url ? (
                      <div className="relative w-32 h-32">
                        <Image
                          src={formData.image_url}
                          alt="Preview"
                          fill
                          className="object-cover rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={removeImage}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex flex-col items-center justify-center w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
                        <Upload className="h-6 w-6 text-gray-400" />
                        <span className="text-xs text-gray-500 mt-1">رفع صورة</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageSelect}
                          className="hidden"
                        />
                      </label>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Input
                      value={formData.video_url}
                      onChange={(e) => setFormData({ ...formData, video_url: e.target.value })}
                      placeholder="رابط فيديو يوتيوب"
                      dir="ltr"
                    />
                    {formData.video_url && (
                      <div className="aspect-video w-full max-w-md">
                        <iframe
                          src={getYouTubeEmbedUrl(formData.video_url)}
                          className="w-full h-full rounded-lg"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_published}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_published: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>منشور</span>
                </label>

                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_pinned}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, is_pinned: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span>مثبت</span>
                </label>
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  إلغاء
                </Button>
                <Button type="submit" className="bg-brand-primary-blue">
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
              <AlertDialogTitle>هل أنت متأكد من حذف هذا الخبر؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف الخبر &quot;{selectedNews?.title}&quot; نهائياً ولا يمكن استرجاعه.
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

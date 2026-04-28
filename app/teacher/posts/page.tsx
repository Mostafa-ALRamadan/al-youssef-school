'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
import { Plus, Edit2, Trash2, FileText, Image as ImageIcon, Newspaper, Upload, X, Video } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { TEACHER_SIDEBAR_ITEMS } from '@/constants';
import Cropper from 'react-easy-crop';
import { Point, Area } from 'react-easy-crop';
import { formatDateLTR } from '@/utils/date';

interface TeacherPost {
  id: string;
  title: string;
  content: string;
  image_url: string | null;
  video_url: string | null;
  created_at: string;
  teacher_name: string;
  class_name: string;
  subject_name: string;
  semester_name: string;
  class_id: string;
  subject_id: string;
}

export default function TeacherPostsPage() {
  const router = useRouter();
  const { toast } = useToast();
  
  const [posts, setPosts] = useState<TeacherPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<TeacherPost | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    video_url: '',
    class_id: '',
    subject_id: '',
  });
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  
  const [assignments, setAssignments] = useState<{
    id: string;
    class_id: string;
    class_name: string;
    subject_id: string;
    subject_name: string;
  }[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);
  
  // Get teacher ID from localStorage or auth
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isCropping, setIsCropping] = useState(false);
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<Area | null>(null);
  
  useEffect(() => {
    const fetchTeacherData = async () => {
      try {
        // Get user info from auth
        const storedToken = localStorage.getItem('auth_token');
        if (!storedToken) {
          router.push('/login');
          return;
        }
        setToken(storedToken);
        
        // Fetch teacher info
        const response = await fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${storedToken}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.user?.role !== 'teacher') {
            router.push('/');
            return;
          }
          
          // Get teacher_id from user data
          const teacherRes = await fetch('/api/teachers/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (teacherRes.ok) {
            const teacherData = await teacherRes.json();
            setTeacherId(teacherData.teacher?.id);
            fetchPosts(teacherData.teacher?.id);
          }
        }
      } catch (error) {
        console.error('Error fetching teacher data:', error);
        setLoading(false);
      }
    };
    
    fetchTeacherData();
  }, [router]);
  
  // Fetch assignments when token is available
  useEffect(() => {
    if (token) {
      const fetchAssignments = async () => {
        try {
          const assignmentsRes = await fetch('/api/teacher-assignments', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (assignmentsRes.ok) {
            const assignmentsData = await assignmentsRes.json();
            setAssignments(assignmentsData.assignments || []);
          }
        } catch (error) {
          console.error('Error fetching assignments:', error);
        }
      };
      fetchAssignments();
    }
  }, [token]);
  
  const fetchPosts = async (tid: string) => {
    try {
      const response = await fetch(`/api/teacher-posts?teacher_id=${tid}`);
      if (response.ok) {
        const data = await response.json();
        setPosts(data.posts || []);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle image file selection - start cropping
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsCropping(true);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    }
  };

  // Handle crop complete
  const onCropComplete = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedArea(croppedAreaPixels);
  };

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

  // Get cropped image as blob
  const getCroppedImage = async (): Promise<Blob | null> => {
    if (!imagePreview || !croppedArea) return null;
    
    const image = new Image();
    image.src = imagePreview;
    await new Promise((resolve) => { image.onload = resolve; });
    
    const canvas = document.createElement('canvas');
    canvas.width = croppedArea.width;
    canvas.height = croppedArea.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    ctx.drawImage(
      image,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      croppedArea.width,
      croppedArea.height
    );
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    });
  };

  // Upload cropped image to server
  const uploadCroppedImage = async (): Promise<string | null> => {
    if (!imageFile) return formData.image_url;
    
    setUploadingImage(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (!croppedBlob) return null;
      
      const formDataUpload = new FormData();
      formDataUpload.append('file', croppedBlob, 'cropped-image.jpg');
      formDataUpload.append('type', 'posts');
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formDataUpload,
      });
      
      if (response.ok) {
        const data = await response.json();
        setIsCropping(false);
        return data.url;
      }
    } catch (error) {
      console.error('Error uploading cropped image:', error);
    } finally {
      setUploadingImage(false);
    }
    return null;
  };
  
  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.content.trim()) {
      toast({
        title: 'خطأ',
        description: 'المحتوى مطلوب',
        variant: 'destructive',
      });
      return;
    }
    
    // Upload image if selected
    let imageUrl = formData.image_url;
    let videoUrl = formData.video_url;
    
    if (imageFile) {
      const uploadedUrl = await uploadCroppedImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }
    
    try {
      const response = await fetch('/api/teacher-posts', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          image_url: imageUrl,
          video_url: videoUrl,
          class_id: formData.class_id,
          subject_id: formData.subject_id,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'تم',
          description: 'تم إنشاء المنشور بنجاح',
        });
        setIsAddDialogOpen(false);
        setFormData({ title: '', content: '', image_url: '', video_url: '', class_id: '', subject_id: '' });
        setImageFile(null);
        setImagePreview('');
        if (teacherId) fetchPosts(teacherId);
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في إنشاء المنشور',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error creating post:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء إنشاء المنشور',
        variant: 'destructive',
      });
    }
  };
  
  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPost || !formData.content.trim()) {
      toast({
        title: 'خطأ',
        description: 'المحتوى مطلوب',
        variant: 'destructive',
      });
      return;
    }
    
    // Upload image if selected, otherwise keep existing or clear if removed
    let imageUrl = formData.image_url;
    let videoUrl = formData.video_url;
    
    if (imageFile) {
      // New image selected and cropped - upload it
      const uploadedUrl = await uploadCroppedImage();
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    } else if (!imagePreview && formData.image_url) {
      // Image was removed (preview cleared but had URL) - set to null
      imageUrl = '';
    }
    
    try {
      const response = await fetch(`/api/teacher-posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          content: formData.content,
          image_url: imageUrl || null,
          video_url: videoUrl,
          class_id: formData.class_id,
          subject_id: formData.subject_id,
        }),
      });
      
      if (response.ok) {
        toast({
          title: 'تم',
          description: 'تم تحديث المنشور بنجاح',
        });
        setIsEditDialogOpen(false);
        setSelectedPost(null);
        setFormData({ title: '', content: '', image_url: '', video_url: '', class_id: '', subject_id: '' });
        setImageFile(null);
        setImagePreview('');
        if (teacherId) fetchPosts(teacherId);
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في تحديث المنشور',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء تحديث المنشور',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async () => {
    if (!selectedPost || !token) return;
    
    try {
      const response = await fetch(`/api/teacher-posts/${selectedPost.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        toast({
          title: 'تم',
          description: 'تم حذف المنشور بنجاح',
        });
        setIsDeleteDialogOpen(false);
        setSelectedPost(null);
        if (teacherId) fetchPosts(teacherId);
      } else {
        const error = await response.json();
        toast({
          title: 'خطأ',
          description: error.error || 'فشل في حذف المنشور',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      toast({
        title: 'خطأ',
        description: 'حدث خطأ أثناء حذف المنشور',
        variant: 'destructive',
      });
    }
  };
  
  const openEditDialog = (post: TeacherPost) => {
    setSelectedPost(post);
    setFormData({
      title: post.title || '',
      content: post.content,
      image_url: post.image_url || '',
      video_url: post.video_url || '',
      class_id: post.class_id || '',
      subject_id: post.subject_id || '',
    });
    setImagePreview(post.image_url || '');
    setImageFile(null);
    setIsCropping(false);
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (post: TeacherPost) => {
    setSelectedPost(post);
    setIsDeleteDialogOpen(true);
  };
  
  if (loading) {
    return (
      <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole="teacher">
        <div className="flex h-full items-center justify-center">
          <div className="text-center">جاري التحميل...</div>
        </div>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout sidebarItems={TEACHER_SIDEBAR_ITEMS} userRole="teacher">
      <div className="space-y-6 p-6" dir="rtl">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Newspaper className="h-8 w-8 text-brand-primary-blue" />
            <h1 className="text-2xl font-bold">منشوراتي</h1>
          </div>
          
          <Button 
            className="bg-brand-primary-blue hover:bg-brand-dark-blue"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="ml-2 h-4 w-4" />
            منشور جديد
          </Button>
          
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogContent className="sm:max-w-[700px] [&>button]:hidden max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء منشور جديد</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>الصف *</Label>
                  <select
                    value={formData.class_id}
                    onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">اختر الصف</option>
                    {Array.from(new Map(assignments.map(a => [a.class_id, a])).values()).map((assignment) => (
                      <option key={assignment.class_id} value={assignment.class_id}>
                        {assignment.class_name}
                      </option>
                    ))}
                  </select>
                  {assignments.length === 0 && (
                    <p className="text-xs text-red-500">لا توجد فصول متاحة</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label>المادة *</Label>
                  <select
                    value={formData.subject_id}
                    onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                    className="w-full p-2 border rounded-md"
                    required
                  >
                    <option value="">اختر المادة</option>
                    {Array.from(new Map(assignments.map(a => [a.subject_id, a])).values()).map((assignment) => (
                      <option key={assignment.subject_id} value={assignment.subject_id}>
                        {assignment.subject_name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label>العنوان (اختياري)</Label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="عنوان المنشور..."
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>المحتوى *</Label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="محتوى المنشور..."
                    rows={5}
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
                        setImageFile(null);
                        setImagePreview('');
                      }}
                      className={mediaType === 'video' ? 'bg-brand-primary-blue' : ''}
                    >
                      <Video className="h-4 w-4 ml-1" />
                      فيديو
                    </Button>
                  </div>

                  {mediaType === 'image' ? (
                    <>
                      {isCropping && imagePreview ? (
                        <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
                          <Cropper
                            image={imagePreview}
                            crop={crop}
                            zoom={zoom}
                            aspect={16 / 9}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                          <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/50 p-2 rounded">
                            <div className="flex items-center gap-2">
                              <span className="text-white text-xs">تكبير:</span>
                              <input
                                type="range"
                                min={1}
                                max={3}
                                step={0.1}
                                value={zoom}
                                onChange={(e) => setZoom(Number(e.target.value))}
                                className="w-20"
                              />
                            </div>
                            <Button
                              type="button"
                              size="sm"
                              onClick={() => setIsCropping(false)}
                              className="bg-white text-black hover:bg-gray-200"
                            >
                              تم
                            </Button>
                          </div>
                        </div>
                      ) : imagePreview ? (
                        <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImageFile(null);
                              setImagePreview('');
                            }}
                            className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : null}
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={handleImageSelect}
                        className="cursor-pointer"
                      />
                      {uploadingImage && (
                        <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
                      )}
                    </>
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
                
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    إلغاء
                  </Button>
                  <Button type="submit" className="bg-brand-primary-blue hover:bg-brand-dark-blue">
                    نشر
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        
        {/* Posts List */}
        {posts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>لا توجد منشورات بعد</p>
            <p className="text-sm mt-2">انقر على "منشور جديد" لإنشاء أول منشور</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map((post) => (
              <Card key={post.id} className="overflow-hidden">
                {post.image_url && (
                  <div className="bg-gray-100">
                    <img
                      src={post.image_url}
                      alt={post.title || 'Post image'}
                      className="w-full h-auto object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {post.video_url && (
                  <div className="h-53 bg-gray-100 flex items-center justify-center relative overflow-hidden">
                    <img
                      src={`https://img.youtube.com/vi/${getYouTubeEmbedUrl(post.video_url).split('/').pop()}/0.jpg`}
                      alt="Video thumbnail"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
                
                {!post.image_url && !post.video_url && (
                  <div className="h-40 bg-gray-100 flex items-center justify-center">
                    <ImageIcon className="h-12 w-12 text-gray-300" />
                  </div>
                )}
                
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">
                    {post.title || 'بدون عنوان'}
                  </CardTitle>
                </CardHeader>
                
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                    {post.content}
                  </p>
                  
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      <p>{post.class_name} - {post.subject_name}</p>
                      <p dir="rtl">{formatDateLTR(post.created_at).replace(/\//g, '\\')}</p>
                    </div>
                    
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(post)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                        onClick={() => openDeleteDialog(post)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
        
        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[700px] [&>button]:hidden max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>تعديل المنشور</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleEdit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>الصف *</Label>
                <select
                  value={formData.class_id}
                  onChange={(e) => setFormData({ ...formData, class_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">اختر الصف</option>
                  {assignments.map((assignment) => (
                    <option key={assignment.class_id} value={assignment.class_id}>
                      {assignment.class_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>المادة *</Label>
                <select
                  value={formData.subject_id}
                  onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                  className="w-full p-2 border rounded-md"
                  required
                >
                  <option value="">اختر المادة</option>
                  {Array.from(new Map(assignments.map(a => [a.subject_id, a])).values()).map((assignment) => (
                    <option key={assignment.subject_id} value={assignment.subject_id}>
                      {assignment.subject_name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2">
                <Label>العنوان (اختياري)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="عنوان المنشور..."
                />
              </div>
              
              <div className="space-y-2">
                <Label>المحتوى *</Label>
                <Textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="محتوى المنشور..."
                  rows={5}
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
                      setImageFile(null);
                      setImagePreview('');
                    }}
                    className={mediaType === 'video' ? 'bg-brand-primary-blue' : ''}
                  >
                    <Video className="h-4 w-4 ml-1" />
                    فيديو
                  </Button>
                </div>

                {mediaType === 'image' ? (
                  <>
                    {isCropping && imagePreview ? (
                      <div className="relative w-full h-64 bg-gray-100 rounded-lg overflow-hidden mb-4">
                        <Cropper
                          image={imagePreview}
                          crop={crop}
                          zoom={zoom}
                          aspect={16 / 9}
                          onCropChange={setCrop}
                          onCropComplete={onCropComplete}
                          onZoomChange={setZoom}
                        />
                        <div className="absolute bottom-2 left-2 right-2 flex justify-between items-center bg-black/50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <span className="text-white text-xs">تكبير:</span>
                            <input
                              type="range"
                              min={1}
                              max={3}
                              step={0.1}
                              value={zoom}
                              onChange={(e) => setZoom(Number(e.target.value))}
                              className="w-20"
                            />
                          </div>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setIsCropping(false)}
                            className="bg-white text-black hover:bg-gray-200"
                          >
                            تم
                          </Button>
                        </div>
                      </div>
                    ) : imagePreview ? (
                      <div className="relative w-full h-40 rounded-lg overflow-hidden mb-2">
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageFile(null);
                            setImagePreview('');
                          }}
                          className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 w-6 h-6 flex items-center justify-center"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : null}
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="cursor-pointer"
                    />
                    {uploadingImage && (
                      <p className="text-sm text-muted-foreground">جاري رفع الصورة...</p>
                    )}
                  </>
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
        
        {/* Delete Confirmation */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
              <AlertDialogDescription>
                سيتم حذف هذا المنشور نهائياً ولا يمكن استرجاعه.
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

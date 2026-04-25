export const SCHOOL_NAME = 'مدرسة اليوسف للمتفوقين';

export const BRAND_COLORS = {
  yellow: '#fdc800',
  primaryBlue: '#0179cf',
  secondaryBlue: '#0079d2',
  darkBlue: '#0053a9',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
} as const;

export const SIDEBAR_ITEMS = [
  { id: 'students', label: 'الطلاب', icon: 'Users', href: '/admin/students' },
  { id: 'teachers', label: 'المعلمون', icon: 'GraduationCap', href: '/admin/teachers' },
  { id: 'teacher-assignments', label: 'تعيين المعلمين', icon: 'UserCog', href: '/admin/teacher-assignments' },
  { id: 'classes', label: 'الصفوف', icon: 'Building', href: '/admin/classes' },
  { id: 'subjects', label: 'المواد', icon: 'BookOpen', href: '/admin/subjects' },
  { id: 'academic-years', label: 'السنوات الدراسية', icon: 'CalendarDays', href: '/admin/academic-years' },
  { id: 'announcements', label: 'الإعلانات', icon: 'Megaphone', href: '/admin/announcements' },
  { id: 'news', label: 'أخبار المدرسة', icon: 'Newspaper', href: '/admin/news' },
  { id: 'attendance', label: 'التفقد اليومي', icon: 'ClipboardCheck', href: '/admin/attendance' },
  { id: 'grades', label: 'العلامات', icon: 'Award', href: '/admin/grades' },
  { id: 'schedule', label: 'البرنامج الأسبوعي', icon: 'Calendar', href: '/admin/schedule' },
  { id: 'complaints', label: 'صندوق الشكاوي', icon: 'MessageSquare', href: '/admin/complaints', requiresMainAdmin: true },
  { id: 'evaluations', label: 'تقييم الطلاب', icon: 'Star', href: '/admin/evaluations' },
  { id: 'stars-of-the-year', label: 'نجوم السنة', icon: 'Trophy', href: '/admin/stars-of-the-year' },
  { id: 'users', label: 'المستخدمين', icon: 'Users', href: '/admin/users' },
] as const;

export const ADMIN_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard', href: '/admin/dashboard' },
  { id: 'payments', label: 'الأقساط', icon: 'Wallet', href: '/admin/payments' },
  ...SIDEBAR_ITEMS,
] as const;

export const TEACHER_SIDEBAR_ITEMS = [
  { id: 'dashboard', label: 'لوحة التحكم', icon: 'LayoutDashboard', href: '/teacher/dashboard' },
  { id: 'students', label: 'طلابي', icon: 'Users', href: '/teacher/students' },
  { id: 'attendance', label: 'التفقد اليومي', icon: 'ClipboardCheck', href: '/teacher/attendance' },
  { id: 'grades', label: 'العلامات', icon: 'Award', href: '/teacher/grades' },
  { id: 'posts', label: 'منشوراتي', icon: 'Newspaper', href: '/teacher/posts' },
  { id: 'schedule', label: 'جدولي', icon: 'Calendar', href: '/teacher/schedule' },
  { id: 'announcements', label: 'الإعلانات', icon: 'Megaphone', href: '/teacher/announcements' },
  { id: 'evaluations', label: 'تقييم الطلاب', icon: 'Star', href: '/teacher/evaluations' },
] as const;

export const API_ROUTES = {
  AUTH: {
    LOGIN: '/api/auth/login',
    LOGOUT: '/api/auth/logout',
    REFRESH: '/api/auth/refresh',
  },
  STUDENTS: {
    BASE: '/api/students',
    BY_ID: (id: string) => `/api/students/${id}`,
  },
  TEACHERS: {
    BASE: '/api/teachers',
    BY_ID: (id: string) => `/api/teachers/${id}`,
  },
  CLASSES: {
    BASE: '/api/classes',
    BY_ID: (id: string) => `/api/classes/${id}`,
  },
  SUBJECTS: {
    BASE: '/api/subjects',
    BY_ID: (id: string) => `/api/subjects/${id}`,
  },
  ANNOUNCEMENTS: {
    BASE: '/api/announcements',
    BY_ID: (id: string) => `/api/announcements/${id}`,
  },
  ATTENDANCE: {
    BASE: '/api/attendance',
    BY_ID: (id: string) => `/api/attendance/${id}`,
  },
  GRADES: {
    BASE: '/api/grades',
    BY_ID: (id: string) => `/api/grades/${id}`,
  },
  FEES: {
    BASE: '/api/fees',
    BY_ID: (id: string) => `/api/fees/${id}`,
  },
  SCHEDULE: {
    BASE: '/api/schedule',
    BY_ID: (id: string) => `/api/schedule/${id}`,
  },
  COMPLAINTS: {
    BASE: '/api/complaints',
    BY_ID: (id: string) => `/api/complaints/${id}`,
  },
} as const;

export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'البريد الإلكتروني أو كلمة المرور غير صحيحة',
    SESSION_EXPIRED: 'انتهت صلاحية الجلسة، يرجى تسجيل الدخول مرة أخرى',
    UNAUTHORIZED: 'غير مصرح لك بالوصول إلى هذا المحتوى',
    FORBIDDEN: 'ليس لديك الصلاحيات الكافية',
  },
  GENERAL: {
    UNKNOWN_ERROR: 'حدث خطأ غير متوقع، يرجى المحاولة مرة أخرى',
    NETWORK_ERROR: 'خطأ في الاتصال، يرجى التحقق من اتصالك بالإنترنت',
    NOT_FOUND: 'العنصر المطلوب غير موجود',
    VALIDATION_ERROR: 'يرجى التحقق من صحة البيانات المدخلة',
  },
} as const;

export const SUCCESS_MESSAGES = {
  CREATED: 'تم الإنشاء بنجاح',
  UPDATED: 'تم التحديث بنجاح',
  DELETED: 'تم الحذف بنجاح',
  SAVED: 'تم الحفظ بنجاح',
  SENT: 'تم الإرسال بنجاح',
  LOGIN_SUCCESS: 'تم تسجيل الدخول بنجاح',
  LOGOUT_SUCCESS: 'تم تسجيل الخروج بنجاح',
} as const;

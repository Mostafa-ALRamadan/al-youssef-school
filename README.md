# مدرسة اليوسف للمتفوقين - نظام إدارة المدرسة

## Al Youssef School - School Management System

A full-stack school management dashboard built with Next.js, TailwindCSS, shadcn/ui, and Supabase.

## المكدس التقني / Tech Stack

### Frontend
- **Next.js 16** - React framework with App Router
- **TailwindCSS** - Utility-first CSS framework
- **shadcn/ui** - UI component library
- **TypeScript** - Type safety
- **RTL Layout** - Right-to-left Arabic layout

### Backend
- **Supabase** - PostgreSQL + Auth + Storage
- **PostgreSQL** - Database
- **Row Level Security** - Data protection

## Brand Colors / ألوان الهوية

- **Primary Yellow:** `#fdc800`
- **Primary Blue:** `#0179cf`
- **Secondary Blue:** `#0079d2`
- **Dark Blue:** `#0053a9`

## Project Structure / هيكل المشروع

```
al-youssef-school/
├── app/
│   ├── api/                    # API Routes
│   │   ├── auth/login/         # Authentication
│   │   ├── students/           # Students API
│   │   ├── teachers/          # Teachers API
│   │   ├── classes/            # Classes API
│   │   ├── subjects/           # Subjects API
│   │   ├── announcements/       # Announcements API
│   │   ├── attendance/         # Attendance API
│   │   ├── grades/             # Grades API
│   │   ├── fees/               # Fees API
│   │   ├── schedule/           # Weekly Schedule API
│   │   └── suggestions/        # Suggestions API
│   ├── admin/dashboard/        # Admin Dashboard
│   ├── teacher/dashboard/      # Teacher Dashboard
│   ├── login/                  # Login Page
│   ├── globals.css             # Global Styles (RTL + Brand Colors)
│   ├── layout.tsx              # Root Layout (Arabic + RTL)
│   └── page.tsx                # Home (redirects to login)
├── components/
│   ├── auth/                   # Authentication Components
│   │   └── LoginForm.tsx
│   ├── dashboard/              # Dashboard Components
│   │   └── StatCard.tsx
│   ├── layout/                 # Layout Components
│   │   ├── DashboardLayout.tsx
│   │   ├── Sidebar.tsx
│   │   └── TopNav.tsx
│   └── ui/                     # shadcn/ui Components
├── constants/                  # Constants
│   └── index.ts
├── hooks/                      # Custom React Hooks
│   ├── useAuth.ts
│   └── useDashboardStats.ts
├── lib/                        # Utilities
│   ├── utils.ts
│   ├── supabase.ts            # Supabase Client
│   └── supabase-server.ts     # Server Supabase Client
├── middleware.ts              # Next.js Middleware (Auth Protection)
├── postman/
│   └── collections/           # Postman API Collections
│       └── al-youssef-school-api.json
├── repositories/              # Data Access Layer
│   └── index.ts
├── services/                  # Business Logic Layer
│   └── index.ts
├── styles/                    # Additional Styles
├── types/                     # TypeScript Types
│   └── index.ts
└── env_template.txt           # Environment Variables Template
```

## Architecture / الهندسة المعمارية

The project follows **Clean Architecture** principles with a 3-layer architecture:

```
API Route → Service Layer → Repository Layer → Supabase
```

### 1. API Routes / مسارات API
RESTful endpoints that receive requests and return responses.

### 2. Service Layer / طبقة الخدمة
Handles business logic and orchestrates data operations.

### 3. Repository Layer / طبقة المستودع
Handles database queries and data access.

## Pages / الصفحات

- `/` - Redirects to login
- `/login` - Login page with Arabic UI
- `/admin/dashboard` - Admin dashboard with statistics
- `/teacher/dashboard` - Teacher dashboard with schedule

## Sidebar Sections / أقسام الشريط الجانبي

### Admin Sidebar
- لوحة التحكم (Dashboard)
- الطلاب (Students)
- المعلمون (Teachers)
- الصفوف (Classes)
- المواد (Subjects)
- الإعلانات (Announcements)
- التفقد اليومي (Daily Attendance)
- العلامات (Grades)
- الأقساط (Fees)
- البرنامج الأسبوعي (Weekly Schedule)
- الاقتراحات (Suggestions)

### Teacher Sidebar
- لوحة التحكم (Dashboard)
- طلابي (My Students)
- التفقد اليومي (Daily Attendance)
- العلامات (Grades)
- جدولي (My Schedule)

## Setup / الإعداد

### 1. Install dependencies
```bash
npm install
```

### 2. Environment Variables
Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Run development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### 4. Build for production
```bash
npm run build
```

## RTL Support / دعم اللغة العربية

The entire UI is designed for Arabic with RTL layout:
- Cairo font for Arabic text
- RTL direction for all layouts
- Arabic translations for all UI text
- Right-aligned text and forms

## Postman Collection

The Postman collection is located at:
```
postman/collections/al-youssef-school-api.json
```

Import this collection into Postman for API testing.

## Features / الميزات

### Implemented ✅
- RTL Arabic layout with Cairo font
- Brand colors integration
- Responsive design
- Login page with Arabic UI
- Admin dashboard with statistics cards
- Teacher dashboard with schedule
- Reusable dashboard layout (Sidebar, TopNav, Content)
- Clean architecture (API → Service → Repository → Supabase)
- Postman API collection for mobile developer
- Middleware for route protection
- TypeScript types for all entities
- API routes for all entities

### To Be Implemented ⏳
- Database schema in Supabase
- Authentication flow with Supabase Auth
- CRUD operations for all entities
- Real-time features
- File upload for student photos
- Export reports (PDF, Excel)
- Mobile app integration

## Contact / التواصل

**مدرسة اليوسف للمتفوقين** - نظام إدارة المدرسة

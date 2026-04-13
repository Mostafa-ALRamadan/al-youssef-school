# Authentication Structure

## Components

### 1. AuthGuard (`components/auth/AuthGuard.tsx`)
- **Purpose**: Basic authentication check (session exists)
- **Usage**: General authentication protection
- **Features**: 
  - Session validation
  - Loading states
  - Redirect to login if not authenticated

### 2. RoleGuard (`components/auth/RoleGuard.tsx`)
- **Purpose**: Role-based access control
- **Usage**: Role-specific protection (admin/teacher)
- **Features**:
  - Database role validation
  - Configurable allowed roles
  - Cross-access prevention

### 3. LoginForm (`components/auth/LoginForm.tsx`)
- **Purpose**: User login interface
- **Usage**: Login page component

## Layouts

### Admin Layout (`app/admin/layout.tsx`)
```tsx
<RoleGuard allowedRoles={['admin']}>
  {children}
</RoleGuard>
```

### Teacher Layout (`app/teacher/layout.tsx`)
```tsx
<RoleGuard allowedRoles={['teacher', 'authenticated']}>
  {children}
</RoleGuard>
```

## Middleware (`middleware.ts`)
- **Status**: Disabled (client-side auth only)
- **Purpose**: Server-side route protection (if needed in future)

## Access Control

### Admin Users
- Can access: `/admin/*` routes
- Cannot access: `/teacher/*` routes
- Required role: `admin`

### Teacher Users  
- Can access: `/teacher/*` routes
- Cannot access: `/admin/*` routes
- Required roles: `teacher` or `authenticated`

## Database Schema

### Users Table
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT,
  role TEXT, -- 'admin', 'teacher', 'authenticated'
  -- other fields...
)
```

## Usage Examples

### Basic Auth Protection
```tsx
<AuthGuard>
  <YourComponent />
</AuthGuard>
```

### Role-Based Protection
```tsx
<RoleGuard allowedRoles={['admin']}>
  <AdminOnlyComponent />
</RoleGuard>
```

### Multiple Roles
```tsx
<RoleGuard allowedRoles={['teacher', 'authenticated']}>
  <TeacherComponent />
</RoleGuard>
```

## Security Features

1. **Session Validation**: Checks Supabase session
2. **Role Verification**: Database role validation
3. **Cross-Access Prevention**: Role-based route blocking
4. **Loading States**: Better UX during auth checks
5. **Automatic Redirects**: Unauthorized users redirected to login

## Future Enhancements

1. **Enable Middleware**: Server-side protection
2. **Permission System**: Fine-grained permissions
3. **Session Management**: Token refresh logic
4. **Audit Logging**: Track access attempts

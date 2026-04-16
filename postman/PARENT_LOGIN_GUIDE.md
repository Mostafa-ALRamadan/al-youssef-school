# Parent Login API Guide for Flutter Developer

## Overview
Parents now log in using their **student's triple name** + **parent password**.
No email is required or shown to parents!

---

## Login Flow

### 1. Parent Enters:
- **Student Login Name**: Triple name like "عمر علي عبده"
- **Password**: The parent's password (set when student was created)

### 2. API Call:

```http
POST /api/auth/parent-login
Content-Type: application/json

{
  "student_login_name": "عمر علي عبده",
  "password": "parent_password"
}
```

### 3. Success Response:

```json
{
  "message": "تم تسجيل الدخول بنجاح",
  "user": {
    "id": "uuid-here",
    "email": "parent_12345678@alyoussef.local",
    "role": "parent"
  },
  "session": {
    "access_token": "eyJhbGc...",
    "refresh_token": "xyz123...",
    "expires_in": 3600
  }
}
```

**Important:** The email in the response is the hidden auth_email (internal use only). Parents never see or use it!

---

## How to Get Student Login Names

### Admin creates students via:
```http
POST /api/students
```

The system auto-generates:
- `login_name`: "عمر علي عبده" (shown to parent for login)
- `auth_email`: "parent_xxx@alyoussef.local" (hidden/internal)

### To get all students with their login names:
```http
GET /api/students
```

Response includes `login_name` field for each student.

---

## Flutter Implementation Example

```dart
// Parent Login
Future<void> parentLogin(String studentLoginName, String password) async {
  final response = await http.post(
    Uri.parse('$baseUrl/api/auth/parent-login'),
    headers: {'Content-Type': 'application/json'},
    body: jsonEncode({
      'student_login_name': studentLoginName,  // e.g., "عمر علي عبده"
      'password': password,
    }),
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    
    // Save tokens
    final accessToken = data['session']['access_token'];
    final refreshToken = data['session']['refresh_token'];
    
    // Store in secure storage (flutter_secure_storage)
    await secureStorage.write(key: 'access_token', value: accessToken);
    await secureStorage.write(key: 'refresh_token', value: refreshToken);
    
    // Navigate to parent dashboard
    Navigator.pushReplacementNamed(context, '/parent/dashboard');
  } else {
    final error = jsonDecode(response.body)['error'];
    showErrorDialog(error);  // e.g., "الطالب غير موجود"
  }
}
```

---

## Admin/Teacher Login (Unchanged)

For admins and teachers, email login still works:

```http
POST /api/auth/login
{
  "email": "admin@school.com",
  "password": "password"
}
```

---

## Testing with Postman

1. **Import the collection**: `postman/al-youssef-school-api.json`
2. **Set baseUrl**: `http://localhost:3000`
3. **Create a student** first (POST /api/students) to get a login_name
4. **Test parent login** using that login_name

---

## Key Points for Flutter Developer

✅ **Parent never sees any email**  
✅ **Login uses student triple name + password**  
✅ **System auto-generates hidden auth email**  
✅ **Same Supabase session tokens returned**  
✅ **Use tokens for authenticated API calls**  

---

## Questions?

Contact the backend developer if you need any clarification!

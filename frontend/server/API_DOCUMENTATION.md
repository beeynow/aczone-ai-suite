# 📚 API Documentation

## Base URL
```
Development: http://localhost:5000/api/v1
Production: https://your-domain.com/api/v1
```

## Authentication

Most endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <access_token>
```

## Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    // Response data
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "details": [
    {
      "field": "email",
      "message": "Invalid email address"
    }
  ]
}
```

## Endpoints

### 1. Register User

**POST** `/auth/register`

Register a new user account.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe" // optional
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

**Error Responses:**
- `400` - Validation error (weak password, invalid email)
- `409` - User already exists
- `429` - Too many registration attempts (rate limit: 3 per hour)

**Password Requirements:**
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

---

### 2. Login

**POST** `/auth/login`

Authenticate user and receive JWT tokens.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "deviceInfo": "Chrome on MacOS" // optional
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "email_verified": true,
      "full_name": "John Doe",
      "role": "user",
      "created_at": "2024-01-11T00:00:00.000Z"
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "accessTokenExpiresAt": "2024-01-11T00:15:00.000Z",
      "refreshTokenExpiresAt": "2024-01-18T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Invalid credentials
- `423` - Account locked (too many failed attempts)
- `429` - Too many login attempts (rate limit: 5 per 15 minutes)

---

### 3. Logout

**POST** `/auth/logout`

Logout user and invalidate tokens.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Logout successful"
}
```

**Error Responses:**
- `401` - Unauthorized (invalid or expired token)

---

### 4. Refresh Token

**POST** `/auth/refresh`

Get a new access token using refresh token.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIs...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
      "accessTokenExpiresAt": "2024-01-11T00:15:00.000Z",
      "refreshTokenExpiresAt": "2024-01-18T00:00:00.000Z"
    }
  }
}
```

**Error Responses:**
- `401` - Invalid or expired refresh token

---

### 5. Verify Email

**GET** `/auth/verify-email?token=<verification_token>`

Verify user's email address.

**Query Parameters:**
- `token` (required) - Email verification token from email

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

**Error Responses:**
- `400` - Invalid or expired token
- `409` - Email already verified
- `429` - Too many verification attempts (rate limit: 5 per hour)

---

### 6. Request Password Reset

**POST** `/auth/request-password-reset`

Request a password reset email.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent"
}
```

**Notes:**
- Returns same response regardless of whether email exists (security)
- Rate limit: 3 requests per hour

---

### 7. Reset Password

**POST** `/auth/reset-password`

Reset password using token from email.

**Headers:**
- `Content-Type: application/json`

**Body:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password reset successful"
}
```

**Error Responses:**
- `400` - Invalid or expired token, weak password
- `401` - Token expired or invalid

---

### 8. Change Password

**POST** `/auth/change-password`

Change password for authenticated user.

**Headers:**
- `Authorization: Bearer <access_token>`
- `Content-Type: application/json`

**Body:**
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass123!"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Password changed successfully"
}
```

**Error Responses:**
- `400` - Weak password
- `401` - Unauthorized or incorrect current password

---

### 9. Get Profile

**GET** `/auth/profile`

Get current user's profile information.

**Headers:**
- `Authorization: Bearer <access_token>`

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**Error Responses:**
- `401` - Unauthorized

---

### 10. Check Authentication

**GET** `/auth/check`

Check if user is authenticated (optional authentication).

**Headers:**
- `Authorization: Bearer <access_token>` (optional)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "email": "user@example.com",
      "role": "user"
    }
  }
}
```

**When Not Authenticated:**
```json
{
  "success": true,
  "data": {
    "authenticated": false,
    "user": null
  }
}
```

---

### 11. Health Check

**GET** `/health`

Check server health status.

**Success Response (200):**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-11T00:00:00.000Z",
  "environment": "development"
}
```

---

## Rate Limiting

All endpoints are rate-limited to prevent abuse:

| Endpoint | Limit | Window |
|----------|-------|--------|
| `/auth/register` | 3 requests | 1 hour |
| `/auth/login` | 5 requests | 15 minutes |
| `/auth/request-password-reset` | 3 requests | 1 hour |
| `/auth/verify-email` | 5 requests | 1 hour |
| General API | 100 requests | 15 minutes |

**Rate Limit Headers:**
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 2024-01-11T00:15:00.000Z
Retry-After: 900 (when limit exceeded)
```

---

## Security Headers

All responses include security headers:
- `Strict-Transport-Security`
- `X-Content-Type-Options`
- `X-Frame-Options`
- `X-XSS-Protection`

---

## Error Codes

| Code | Meaning |
|------|---------|
| `200` | Success |
| `201` | Created |
| `400` | Bad Request (validation error) |
| `401` | Unauthorized (invalid token) |
| `403` | Forbidden (insufficient permissions) |
| `404` | Not Found |
| `409` | Conflict (resource already exists) |
| `423` | Locked (account locked) |
| `429` | Too Many Requests (rate limit) |
| `500` | Internal Server Error |

---

## Examples

### Complete Authentication Flow

#### 1. Register
```bash
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!",
    "fullName": "John Doe"
  }'
```

#### 2. Verify Email (from email link)
```bash
curl -X GET "http://localhost:5000/api/v1/auth/verify-email?token=YOUR_TOKEN"
```

#### 3. Login
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

#### 4. Access Protected Resource
```bash
curl -X GET http://localhost:5000/api/v1/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

#### 5. Refresh Token (when access token expires)
```bash
curl -X POST http://localhost:5000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

#### 6. Logout
```bash
curl -X POST http://localhost:5000/api/v1/auth/logout \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "YOUR_REFRESH_TOKEN"
  }'
```

---

## Integration Tips

### Frontend Token Management

```typescript
// Store tokens after login
const storeTokens = (tokens) => {
  localStorage.setItem('accessToken', tokens.accessToken);
  localStorage.setItem('refreshToken', tokens.refreshToken);
  localStorage.setItem('accessTokenExpiry', tokens.accessTokenExpiresAt);
};

// Axios interceptor for automatic token refresh
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      const response = await axios.post('/auth/refresh', { refreshToken });
      
      const { tokens } = response.data.data;
      storeTokens(tokens);
      
      originalRequest.headers.Authorization = `Bearer ${tokens.accessToken}`;
      return axios(originalRequest);
    }
    
    return Promise.reject(error);
  }
);
```

### React Context Example

```typescript
// AuthContext.tsx
const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      try {
        const response = await api.get('/auth/check');
        if (response.data.data.authenticated) {
          setUser(response.data.data.user);
        }
      } catch (error) {
        localStorage.clear();
      }
    }
    setLoading(false);
  };

  const login = async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    const { user, tokens } = response.data.data;
    storeTokens(tokens);
    setUser(user);
  };

  const logout = async () => {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    localStorage.clear();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## Testing with Postman

Import the provided `postman_collection.json` file to test all endpoints.

**Environment Variables:**
- `base_url`: `http://localhost:5000/api/v1`
- `access_token`: (auto-updated after login)
- `refresh_token`: (auto-updated after login)

---

## Support

For issues or questions, contact the development team or refer to the main README.md.

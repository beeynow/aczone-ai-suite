# ACZone Authentication Backend

A powerful, professional authentication backend built with Express.js, JWT, Nodemailer, and Redis.

## 🚀 Features

### Core Authentication
- ✅ **User Registration** with email verification
- ✅ **Secure Login** with JWT tokens
- ✅ **Token Refresh** mechanism
- ✅ **Password Reset** via email
- ✅ **Email Verification** workflow
- ✅ **Change Password** for logged-in users
- ✅ **Account Lockout** after failed login attempts

### Security Features
- 🔐 **JWT Authentication** with access and refresh tokens
- 🛡️ **Helmet.js** security headers
- 🔒 **Bcrypt** password hashing (12 rounds)
- 🚦 **Rate Limiting** (Redis-based)
- 🔑 **Token Blacklisting** on logout
- 🌐 **CORS** configuration
- 🧹 **Input Sanitization**
- 📊 **Request Logging**

### Email Service
- 📧 **Professional Email Templates**
  - Email Verification
  - Welcome Email
  - Password Reset
  - Password Reset Confirmation
  - Two-Factor Authentication (ready)
- ✉️ **Nodemailer** with connection pooling
- 🎨 **Modern HTML Design** with responsive layouts
- 📬 **Bulk Email Support** with rate limiting

### Developer Experience
- 📝 **TypeScript** for type safety
- ✅ **Zod Validation** for request validation
- 🪵 **Winston Logger** with file rotation
- 🔄 **Hot Reload** with tsx watch
- 🎯 **Async Error Handling**
- 📚 **Comprehensive Documentation**

## 📦 Installation

1. **Install dependencies:**
\`\`\`bash
cd server
npm install
\`\`\`

2. **Set up environment variables:**
\`\`\`bash
cp .env.example .env
\`\`\`

3. **Edit `.env` with your configuration:**
   - Database URL (Supabase or PostgreSQL)
   - JWT secrets (generate secure random strings)
   - SMTP credentials (Gmail, SendGrid, etc.)
   - Redis configuration
   - Frontend URLs

4. **Install Redis** (if not already installed):
\`\`\`bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis

# Windows (use WSL or Docker)
docker run -d -p 6379:6379 redis:alpine
\`\`\`

## 🔧 Configuration

### MongoDB Setup

You can use either a local MongoDB instance or MongoDB Atlas (cloud).

#### Option 1: Local MongoDB
```bash
# macOS
brew install mongodb-community
brew services start mongodb-community

# Ubuntu/Debian
sudo apt-get install mongodb
sudo systemctl start mongodb

# Docker
docker run -d -p 27017:27017 --name mongodb mongo:7

# Connection string
MONGODB_URI=mongodb://localhost:27017/aczone_auth
```

#### Option 2: MongoDB Atlas (Cloud)
1. Create free account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get connection string from "Connect" button
6. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth?retryWrites=true&w=majority
```

### Gmail SMTP Setup

1. Enable 2-Factor Authentication on your Gmail account
2. Generate an App Password:
   - Go to Google Account Settings
   - Security → 2-Step Verification → App passwords
   - Generate a new app password
3. Use the app password in your `.env` file

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `MONGODB_URI` | MongoDB connection string | ✅ |
| `JWT_SECRET` | Secret for access tokens (32+ chars) | ✅ |
| `JWT_REFRESH_SECRET` | Secret for refresh tokens (32+ chars) | ✅ |
| `SMTP_HOST` | SMTP server host | ✅ |
| `SMTP_PORT` | SMTP server port | ✅ |
| `SMTP_USER` | SMTP username/email | ✅ |
| `SMTP_PASSWORD` | SMTP password | ✅ |
| `REDIS_HOST` | Redis server host | ✅ |
| `FRONTEND_URL` | Frontend application URL | ✅ |

## 🚀 Usage

### Development Mode
\`\`\`bash
npm run dev
\`\`\`

### Build for Production
\`\`\`bash
npm run build
\`\`\`

### Start Production Server
\`\`\`bash
npm start
\`\`\`

### Linting
\`\`\`bash
npm run lint
\`\`\`

## 📡 API Endpoints

### Authentication

#### Register User
\`\`\`http
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "fullName": "John Doe"
}
\`\`\`

#### Login
\`\`\`http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
\`\`\`

#### Refresh Token
\`\`\`http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
\`\`\`

#### Verify Email
\`\`\`http
GET /api/v1/auth/verify-email?token=your-verification-token
\`\`\`

#### Request Password Reset
\`\`\`http
POST /api/v1/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
\`\`\`

#### Reset Password
\`\`\`http
POST /api/v1/auth/reset-password
Content-Type: application/json

{
  "token": "your-reset-token",
  "newPassword": "NewSecurePass123!"
}
\`\`\`

#### Change Password (Authenticated)
\`\`\`http
POST /api/v1/auth/change-password
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
\`\`\`

#### Get Profile (Authenticated)
\`\`\`http
GET /api/v1/auth/profile
Authorization: Bearer your-access-token
\`\`\`

#### Logout (Authenticated)
\`\`\`http
POST /api/v1/auth/logout
Authorization: Bearer your-access-token
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
\`\`\`

#### Check Authentication Status
\`\`\`http
GET /api/v1/auth/check
Authorization: Bearer your-access-token (optional)
\`\`\`

### Health Check
\`\`\`http
GET /api/v1/health
\`\`\`

## 🔒 Security Best Practices

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character
- Not a common password

### Rate Limits
- **Registration:** 3 requests per hour
- **Login:** 5 attempts per 15 minutes
- **Password Reset:** 3 requests per hour
- **Email Verification:** 5 requests per hour
- **General API:** 100 requests per 15 minutes

### Account Lockout
- Account locked after 5 failed login attempts
- Lockout duration: 15 minutes
- Attempts reset on successful login

### Token Expiration
- **Access Token:** 15 minutes
- **Refresh Token:** 7 days
- **Email Verification:** 24 hours
- **Password Reset:** 1 hour

## 🏗️ Architecture

\`\`\`
server/
├── src/
│   ├── config/          # Configuration files
│   │   ├── env.ts       # Environment validation
│   │   ├── database.ts  # Database interfaces
│   │   └── redis.ts     # Redis client
│   ├── controllers/     # Route controllers
│   │   └── auth.controller.ts
│   ├── middleware/      # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── rateLimiter.middleware.ts
│   │   ├── security.middleware.ts
│   │   └── validation.middleware.ts
│   ├── routes/          # API routes
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── services/        # Business logic
│   │   ├── auth.service.ts
│   │   └── email.service.ts
│   ├── templates/       # Email templates
│   │   └── email.templates.ts
│   ├── utils/           # Utility functions
│   │   ├── jwt.ts       # JWT utilities
│   │   ├── logger.ts    # Winston logger
│   │   └── password.ts  # Password utilities
│   ├── app.ts           # Express app setup
│   └── index.ts         # Entry point
├── .env.example         # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md
\`\`\`

## 🔄 Integration with Frontend

### Store Tokens
\`\`\`typescript
// After successful login
const { accessToken, refreshToken } = response.data.tokens;

// Store in localStorage or secure cookie
localStorage.setItem('accessToken', accessToken);
localStorage.setItem('refreshToken', refreshToken);
\`\`\`

### Make Authenticated Requests
\`\`\`typescript
const response = await fetch('/api/v1/auth/profile', {
  headers: {
    'Authorization': \`Bearer \${accessToken}\`,
    'Content-Type': 'application/json'
  }
});
\`\`\`

### Handle Token Refresh
\`\`\`typescript
// When access token expires (401 error)
const refreshResponse = await fetch('/api/v1/auth/refresh', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ refreshToken })
});

const { tokens } = refreshResponse.data;
localStorage.setItem('accessToken', tokens.accessToken);
\`\`\`

## 📊 Monitoring & Logging

Logs are stored in the `logs/` directory:
- `error.log` - Error level logs
- `combined.log` - All logs
- `exceptions.log` - Uncaught exceptions
- `rejections.log` - Unhandled promise rejections

## 🧪 Testing

\`\`\`bash
# Run tests (when implemented)
npm test
\`\`\`

## 🚀 Deployment

### Environment Setup
1. Set all production environment variables
2. Generate secure JWT secrets
3. Configure production SMTP service
4. Set up production Redis instance
5. Configure production database

### Production Checklist
- ✅ Set `NODE_ENV=production`
- ✅ Use strong JWT secrets (64+ characters)
- ✅ Enable HTTPS
- ✅ Configure CORS for production domains
- ✅ Set up monitoring and alerting
- ✅ Configure log rotation
- ✅ Enable Redis persistence
- ✅ Set up database backups

## 📝 License

MIT

## 👨‍💻 Author

ACZone AI Suite Team

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

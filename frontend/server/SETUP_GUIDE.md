# 🚀 Quick Setup Guide

## Prerequisites

- Node.js 18+ installed
- Redis installed and running
- PostgreSQL database (or Supabase account)
- Email service credentials (Gmail, SendGrid, etc.)

## Step-by-Step Setup

### 1. Install Dependencies

\`\`\`bash
cd server
npm install
\`\`\`

### 2. Start Redis

\`\`\`bash
# macOS
brew services start redis

# Linux
sudo systemctl start redis

# Or use Docker
docker run -d -p 6379:6379 --name redis redis:alpine
\`\`\`

Verify Redis is running:
\`\`\`bash
redis-cli ping
# Should return: PONG
\`\`\`

### 3. Configure Environment Variables

Copy the example file:
\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and update the following:

#### Required Settings

\`\`\`env
# Database (use your Supabase URL or PostgreSQL connection string)
DATABASE_URL=postgresql://user:password@localhost:5432/aczone_auth

# JWT Secrets (MUST CHANGE - generate random strings)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-min-32-chars
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-chars

# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-specific-password
EMAIL_FROM="ACZone AI Suite <noreply@aczone.ai>"

# Frontend URLs (update with your frontend URL)
FRONTEND_URL=http://localhost:5173
VERIFY_EMAIL_URL=http://localhost:5173/verify-email
RESET_PASSWORD_URL=http://localhost:5173/reset-password

# CORS (update with your frontend URL)
CORS_ORIGIN=http://localhost:5173
\`\`\`

### 4. Generate Strong JWT Secrets

\`\`\`bash
# Generate random secrets (Node.js)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Or use openssl
openssl rand -hex 64
\`\`\`

### 5. Set Up Gmail SMTP (if using Gmail)

1. **Enable 2-Factor Authentication:**
   - Go to [Google Account Settings](https://myaccount.google.com/)
   - Security → 2-Step Verification → Enable

2. **Generate App Password:**
   - Security → 2-Step Verification → App passwords
   - Select "Mail" and your device
   - Copy the generated password

3. **Update `.env`:**
\`\`\`env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-16-character-app-password
\`\`\`

### 6. Alternative SMTP Services

#### SendGrid
\`\`\`env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=your-sendgrid-api-key
\`\`\`

#### Mailgun
\`\`\`env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-smtp-username
SMTP_PASSWORD=your-mailgun-smtp-password
\`\`\`

#### AWS SES
\`\`\`env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-ses-smtp-username
SMTP_PASSWORD=your-ses-smtp-password
\`\`\`

### 7. Database Setup

You can use either **Local MongoDB** or **MongoDB Atlas** (cloud).

#### Option A: Local MongoDB

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Ubuntu/Debian:**
```bash
sudo apt-get install mongodb
sudo systemctl start mongodb
```

**Docker (Easiest):**
```bash
cd server
docker-compose up -d mongodb
```

**Connection string:**
```env
MONGODB_URI=mongodb://localhost:27017/aczone_auth
```

#### Option B: MongoDB Atlas (Cloud - Free Tier)

1. Create account at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create free cluster (M0 - 512MB)
3. Create database user (Database Access)
4. Whitelist IP: `0.0.0.0/0` (Network Access)
5. Get connection string (Connect → Connect your application)
6. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth?retryWrites=true&w=majority
```

### 8. Start the Server

#### Development Mode (with hot reload):
\`\`\`bash
npm run dev
\`\`\`

#### Production Mode:
\`\`\`bash
npm run build
npm start
\`\`\`

### 9. Verify Server is Running

Open your browser and visit:
- Health check: http://localhost:5000/api/v1/health
- API info: http://localhost:5000/api/v1

You should see:
\`\`\`json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-11T00:00:00.000Z",
  "environment": "development"
}
\`\`\`

## 🧪 Testing the API

### Test Registration

\`\`\`bash
curl -X POST http://localhost:5000/api/v1/auth/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!",
    "fullName": "Test User"
  }'
\`\`\`

Expected response:
\`\`\`json
{
  "success": true,
  "message": "Registration successful. Please check your email to verify your account.",
  "data": {
    "userId": "uuid-here"
  }
}
\`\`\`

### Test Login

\`\`\`bash
curl -X POST http://localhost:5000/api/v1/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "test@example.com",
    "password": "SecurePass123!"
  }'
\`\`\`

### Test Protected Route

\`\`\`bash
curl -X GET http://localhost:5000/api/v1/auth/profile \\
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
\`\`\`

## 🔧 Troubleshooting

### Redis Connection Failed
\`\`\`
Error: Redis connection error
\`\`\`
**Solution:** Make sure Redis is running:
\`\`\`bash
redis-cli ping
\`\`\`

### Email Service Failed
\`\`\`
Error: Failed to send email
\`\`\`
**Solution:** 
- Check SMTP credentials in `.env`
- For Gmail, make sure you're using an App Password (not your regular password)
- Check if less secure apps are enabled

### Environment Variables Invalid
\`\`\`
Error: Invalid environment variables
\`\`\`
**Solution:** 
- Make sure all required variables in `.env` are set
- JWT secrets must be at least 32 characters
- URLs must be valid (include http:// or https://)

### Port Already in Use
\`\`\`
Error: Port 5000 already in use
\`\`\`
**Solution:** Change the PORT in `.env`:
\`\`\`env
PORT=5001
\`\`\`

## 📚 Next Steps

1. **Integrate with Frontend:**
   - Update frontend to use the API endpoints
   - Implement token storage and refresh logic
   - Create auth context/provider

2. **Database Integration:**
   - Replace Redis user storage with actual database
   - Set up database migrations
   - Implement user CRUD operations

3. **Additional Features:**
   - Add OAuth providers (Google, GitHub)
   - Implement two-factor authentication
   - Add user roles and permissions
   - Create admin panel

4. **Production Deployment:**
   - Set up environment variables on hosting platform
   - Configure production database
   - Set up monitoring and logging
   - Enable HTTPS

## 🎉 Success!

Your authentication backend is now running! You should see:

\`\`\`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 ACZone Authentication Server Started!               ║
║                                                           ║
║   Environment: development                                ║
║   Port:        5000                                       ║
║   API Version: v1                                         ║
║                                                           ║
║   📡 Server:   http://localhost:5000                     ║
║   🔐 API:      http://localhost:5000/api/v1             ║
║   💚 Health:   http://localhost:5000/api/v1/health      ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
\`\`\`

Need help? Check the README.md for detailed documentation!

# Changelog

## [2.0.0] - MongoDB Migration - 2024-01-11

### 🔄 Breaking Changes
- **Migrated from PostgreSQL to MongoDB**
  - Changed `DATABASE_URL` to `MONGODB_URI` in environment variables
  - All data storage now uses MongoDB with Mongoose ODM

### ✨ Added
- **MongoDB Integration**
  - `server/src/config/mongodb.ts` - MongoDB connection client
  - `server/src/models/User.model.ts` - User schema and model
  - `server/src/models/RefreshToken.model.ts` - Refresh token with TTL index
  - `server/src/models/EmailVerificationToken.model.ts` - Email verification with TTL
  - `server/src/models/PasswordResetToken.model.ts` - Password reset with TTL

- **New Dependencies**
  - `mongoose@^8.1.1` - MongoDB ODM
  - `@types/mongoose@^5.11.97` - TypeScript definitions

- **Documentation**
  - `server/MONGODB_MIGRATION.md` - Complete migration guide
  - Updated all documentation for MongoDB

### 🔧 Changed
- **Environment Configuration**
  - `MONGODB_URI` replaces `DATABASE_URL`
  - Updated `.env.example` and `.env` templates
  - Updated environment validation in `src/config/env.ts`

- **Docker Configuration**
  - Replaced PostgreSQL with MongoDB in `docker-compose.yml`
  - MongoDB 7 with automatic health checks
  - Persistent volumes for data and config

- **Authentication Service**
  - Completely rewritten to use Mongoose models
  - All database queries now use MongoDB
  - Automatic JSON transformation (excludes passwords)
  - Better error handling with MongoDB errors

- **Application Startup**
  - Added MongoDB connection on startup
  - Graceful MongoDB disconnection on shutdown
  - Connection health checks

### 🗑️ Removed
- `server/src/config/database.ts` - No longer needed (replaced by Mongoose models)
- PostgreSQL dependencies from docker-compose.yml
- All PostgreSQL/Supabase references in documentation

### 🎯 Features
- **Automatic TTL Indexes**
  - Email verification tokens expire after 24 hours
  - Password reset tokens expire after 1 hour
  - Refresh tokens expire after 7 days
  - Expired tokens automatically deleted by MongoDB

- **Automatic Indexes**
  - Email index (unique)
  - Token indexes (unique)
  - User ID indexes for fast lookups
  - Timestamp indexes for sorting

- **Schema Validation**
  - Built-in Mongoose validation
  - Type-safe models with TypeScript
  - Automatic field validation

### 📊 Performance
- Connection pooling (10 max, 2 min)
- Indexed queries for fast lookups
- TTL indexes for automatic cleanup
- Efficient JSON transformation

### 🚀 Migration Path
See `MONGODB_MIGRATION.md` for detailed migration instructions.

---

## [1.0.0] - Initial Release - 2024-01-11

### ✨ Initial Features
- User registration with email verification
- Secure login with JWT tokens
- Token refresh mechanism
- Password reset via email
- Email verification workflow
- Account lockout protection
- Professional email templates (5 types)
- Rate limiting (Redis-based)
- Security headers (Helmet.js)
- Input validation (Zod)
- Comprehensive error handling
- Winston logging
- Docker support
- Postman collection
- Complete documentation

### 🔐 Security
- JWT authentication
- Bcrypt password hashing (12 rounds)
- Password strength validation
- Token blacklisting
- Account lockout after 5 failed attempts
- XSS protection
- SQL injection prevention
- CORS configuration
- HTTPS ready

### 📧 Email Service
- Nodemailer integration
- 5 professional templates
- HTML + plain text
- Responsive design
- Connection pooling

### 📚 Documentation
- README.md
- SETUP_GUIDE.md
- API_DOCUMENTATION.md
- FEATURES.md
- DEPLOYMENT.md
- Postman collection

---

**Database:** Now uses MongoDB instead of PostgreSQL  
**Migration Guide:** See MONGODB_MIGRATION.md

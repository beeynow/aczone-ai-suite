# 🔄 MongoDB Migration Guide

## What Changed

The authentication backend has been migrated from PostgreSQL/Supabase to **MongoDB with Mongoose**.

## Key Changes

### 1. Database Configuration
- **Before:** `DATABASE_URL` (PostgreSQL connection string)
- **After:** `MONGODB_URI` (MongoDB connection string)

### 2. New Dependencies
```json
{
  "mongoose": "^8.1.1",
  "@types/mongoose": "^5.11.97"
}
```

### 3. New Files Created
```
server/src/
├── config/
│   └── mongodb.ts              # MongoDB connection client
├── models/
│   ├── User.model.ts           # User schema & model
│   ├── RefreshToken.model.ts  # Refresh token schema
│   ├── EmailVerificationToken.model.ts
│   └── PasswordResetToken.model.ts
└── services/
    └── auth.service.ts         # Updated with Mongoose queries
```

### 4. Files Removed
- `server/src/config/database.ts` (replaced with MongoDB models)

## MongoDB Schemas

### User Schema
```typescript
{
  email: String (unique, indexed)
  password_hash: String
  email_verified: Boolean
  full_name: String
  avatar_url: String
  role: 'user' | 'admin' | 'moderator'
  is_active: Boolean
  login_attempts: Number
  locked_until: Date
  last_login: Date
  created_at: Date
  updated_at: Date
}
```

### RefreshToken Schema
```typescript
{
  user_id: ObjectId (ref: User)
  token: String (unique, indexed)
  expires_at: Date (TTL index)
  revoked: Boolean
  replaced_by: String
  device_info: String
  created_at: Date
}
```

### EmailVerificationToken Schema
```typescript
{
  user_id: ObjectId (ref: User)
  token: String (unique, indexed)
  expires_at: Date (TTL index)
  used: Boolean
  created_at: Date
}
```

### PasswordResetToken Schema
```typescript
{
  user_id: ObjectId (ref: User)
  token: String (unique, indexed)
  expires_at: Date (TTL index)
  used: Boolean
  created_at: Date
}
```

## Setup Instructions

### 1. Install MongoDB

#### Option A: Local Installation

**macOS:**
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
```

**Ubuntu/Debian:**
```bash
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
```

**Windows:**
- Download installer from [mongodb.com/download-center/community](https://www.mongodb.com/try/download/community)
- Run installer and follow instructions
- MongoDB will run as a Windows service

**Docker:**
```bash
docker run -d \
  -p 27017:27017 \
  --name mongodb \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  mongo:7
```

**Docker Compose (Recommended):**
```bash
cd server
docker-compose up -d mongodb
```

#### Option B: MongoDB Atlas (Cloud - Free Tier Available)

1. Go to [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster (M0 Free tier)
4. Create a database user:
   - Click "Database Access"
   - Add new database user
   - Set username and password
5. Whitelist IP address:
   - Click "Network Access"
   - Add IP Address
   - Use `0.0.0.0/0` for development (not recommended for production)
6. Get connection string:
   - Click "Clusters" → "Connect"
   - Choose "Connect your application"
   - Copy connection string
7. Update `.env`:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth?retryWrites=true&w=majority
```

### 2. Update Environment Variables

Edit `server/.env`:

```env
# Change this line:
# DATABASE_URL=postgresql://localhost:5432/aczone_auth

# To this:
MONGODB_URI=mongodb://localhost:27017/aczone_auth

# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth?retryWrites=true&w=majority
```

### 3. Install Dependencies

```bash
cd server
npm install
```

This will install:
- `mongoose@^8.1.1`
- `@types/mongoose@^5.11.97`

### 4. Start the Server

```bash
npm run dev
```

You should see:
```
✅ MongoDB connected successfully
✅ Redis connected successfully
🚀 ACZone Authentication Server Started!
```

## Verify Connection

```bash
# Test health endpoint
curl http://localhost:5000/api/v1/health

# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "Test123!@#",
    "fullName": "Test User"
  }'
```

## MongoDB Features

### Automatic Indexes
The models automatically create indexes on:
- `email` (unique)
- `token` fields (unique)
- `expires_at` (TTL indexes for automatic cleanup)
- `user_id` (for fast lookups)

### TTL (Time To Live) Indexes
Expired tokens are automatically deleted by MongoDB:
- Email verification tokens expire after 24 hours
- Password reset tokens expire after 1 hour
- Refresh tokens expire after 7 days

### JSON Transformation
User passwords are automatically excluded when converting to JSON:
```typescript
user.toJSON() // password_hash is removed automatically
```

## Database Administration

### MongoDB Compass (GUI)
Download MongoDB Compass for visual database management:
- [mongodb.com/products/compass](https://www.mongodb.com/products/compass)
- Connection string: `mongodb://localhost:27017`

### MongoDB Shell (mongosh)
```bash
# Connect to local MongoDB
mongosh

# Switch to database
use aczone_auth

# View collections
show collections

# Query users
db.users.find()

# Count documents
db.users.countDocuments()

# Create index manually
db.users.createIndex({ email: 1 }, { unique: true })
```

## Troubleshooting

### Connection Failed
```
Error: connect ECONNREFUSED 127.0.0.1:27017
```
**Solution:** Make sure MongoDB is running
```bash
# macOS
brew services list
brew services start mongodb-community

# Linux
sudo systemctl status mongod
sudo systemctl start mongod

# Docker
docker ps | grep mongo
docker start mongodb
```

### Authentication Failed
```
Error: Authentication failed
```
**Solution:** Check your MongoDB URI credentials
- For local: Usually no auth required
- For Atlas: Verify username/password in connection string

### Database Not Found
MongoDB automatically creates databases when you first insert data. No migration needed!

## Performance Tips

### Indexes
All necessary indexes are automatically created by Mongoose schemas.

### Connection Pooling
Configured in `mongodb.ts`:
```typescript
{
  maxPoolSize: 10,
  minPoolSize: 2,
}
```

### Query Optimization
- Use `.lean()` for read-only queries (faster)
- Use `.select()` to limit fields
- Add indexes for frequently queried fields

## Migration from PostgreSQL

If you were using the PostgreSQL version:

1. **Export data** from PostgreSQL:
```bash
pg_dump -U user -d aczone_auth -t users --data-only > users.sql
```

2. **Convert to JSON** (manual process or use a tool)

3. **Import to MongoDB**:
```javascript
// In mongosh
use aczone_auth

db.users.insertMany([
  {
    email: "user@example.com",
    password_hash: "...",
    email_verified: true,
    // ... other fields
  }
])
```

Or use a migration script with both databases connected.

## Backup & Restore

### Backup
```bash
mongodump --uri="mongodb://localhost:27017/aczone_auth" --out=./backup
```

### Restore
```bash
mongorestore --uri="mongodb://localhost:27017/aczone_auth" ./backup/aczone_auth
```

### MongoDB Atlas Backup
- Automatic backups included in free tier
- Configure in Atlas dashboard

## Production Considerations

### MongoDB Atlas (Recommended for Production)
- Free tier: M0 (512MB storage)
- Paid tiers: M10+ (2GB+ storage, backups, monitoring)
- Features: Automated backups, monitoring, alerts

### Connection String Security
- Use environment variables
- Never commit connection strings
- Use VPC peering in production
- Enable authentication

### Replica Sets
For high availability:
```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/aczone_auth?replicaSet=rs0
```

## Benefits of MongoDB

✅ **Flexible Schema:** Easy to add new fields  
✅ **JSON Native:** Perfect for Node.js/JavaScript  
✅ **Horizontal Scaling:** Sharding support  
✅ **TTL Indexes:** Automatic cleanup of expired tokens  
✅ **Rich Queries:** Powerful query language  
✅ **Cloud Ready:** MongoDB Atlas free tier  
✅ **Great Performance:** Fast reads and writes  

## Support

- MongoDB Documentation: [docs.mongodb.com](https://docs.mongodb.com)
- Mongoose Documentation: [mongoosejs.com](https://mongoosejs.com)
- MongoDB University: Free courses at [university.mongodb.com](https://university.mongodb.com)

---

**Your authentication backend now uses MongoDB! 🎉**

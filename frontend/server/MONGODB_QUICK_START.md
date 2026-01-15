# 🚀 MongoDB Quick Start

## TL;DR - Get Running in 2 Minutes

### Option 1: Docker (Easiest)
```bash
cd server
docker-compose up -d mongodb redis
npm install
npm run dev
```

### Option 2: MongoDB Atlas (Free Cloud)
```bash
# 1. Sign up: https://www.mongodb.com/cloud/atlas/register
# 2. Create free cluster (M0)
# 3. Get connection string
# 4. Update .env:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth

# 5. Install and run
npm install
npm run dev
```

### Option 3: Local MongoDB
```bash
# Install MongoDB
brew install mongodb-community  # macOS
# or
sudo apt-get install mongodb    # Ubuntu

# Start MongoDB
brew services start mongodb-community  # macOS
# or
sudo systemctl start mongodb           # Ubuntu

# Update .env
MONGODB_URI=mongodb://localhost:27017/aczone_auth

# Install and run
npm install
npm run dev
```

## Verify It's Working

```bash
# Test health endpoint
curl http://localhost:5000/api/v1/health

# Register a user
curl -X POST http://localhost:5000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!@#"}'
```

## Connection Strings

### Local MongoDB
```
MONGODB_URI=mongodb://localhost:27017/aczone_auth
```

### MongoDB Atlas
```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/aczone_auth?retryWrites=true&w=majority
```

### Docker
```
MONGODB_URI=mongodb://aczone:your_secure_password_change_this@localhost:27017/aczone_auth?authSource=admin
```

## That's It! 🎉

Your authentication backend is now running with MongoDB!

**Next Steps:**
- Import Postman collection to test API
- Read MONGODB_MIGRATION.md for details
- Check README.md for full documentation

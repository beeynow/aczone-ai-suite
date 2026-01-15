# 🚀 Deployment Guide

## Deployment Platforms

### 1. Heroku

#### Setup
```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS
# or download from heroku.com

# Login
heroku login

# Create app
heroku create aczone-auth-api

# Add Redis addon
heroku addons:create heroku-redis:hobby-dev

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set JWT_SECRET=$(openssl rand -hex 64)
heroku config:set JWT_REFRESH_SECRET=$(openssl rand -hex 64)
heroku config:set SMTP_HOST=smtp.gmail.com
heroku config:set SMTP_PORT=587
heroku config:set SMTP_USER=your-email@gmail.com
heroku config:set SMTP_PASSWORD=your-app-password
# ... set all other env vars

# Deploy
git push heroku main

# Open app
heroku open
```

### 2. Railway

#### Setup
1. Connect GitHub repository
2. Add Redis service
3. Configure environment variables
4. Deploy automatically on push

### 3. Render

#### Setup
1. Create new Web Service
2. Connect repository
3. Add Redis instance
4. Set environment variables
5. Deploy

### 4. AWS (EC2 + ElastiCache)

#### Setup
```bash
# 1. Launch EC2 instance (Ubuntu)
# 2. Install Node.js, Redis
# 3. Clone repository
# 4. Set up environment variables
# 5. Use PM2 for process management

# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/index.js --name aczone-auth

# Set up PM2 to start on boot
pm2 startup
pm2 save

# Configure Nginx reverse proxy
sudo apt install nginx
# Configure /etc/nginx/sites-available/aczone-auth
```

### 5. Docker Deployment

#### Build and Run
```bash
# Build image
docker build -t aczone-auth .

# Run with Docker Compose
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop
docker-compose down
```

## Environment Variables Checklist

### Required
- [ ] NODE_ENV=production
- [ ] PORT=5000
- [ ] DATABASE_URL
- [ ] JWT_SECRET (64+ chars)
- [ ] JWT_REFRESH_SECRET (64+ chars)
- [ ] REDIS_HOST
- [ ] REDIS_PORT
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USER
- [ ] SMTP_PASSWORD
- [ ] EMAIL_FROM
- [ ] FRONTEND_URL
- [ ] VERIFY_EMAIL_URL
- [ ] RESET_PASSWORD_URL
- [ ] CORS_ORIGIN

### Optional
- [ ] REDIS_PASSWORD
- [ ] LOG_LEVEL=info
- [ ] BCRYPT_ROUNDS=12

## Pre-Deployment Checklist

### Security
- [ ] Strong JWT secrets generated
- [ ] Environment variables secured
- [ ] HTTPS enabled
- [ ] CORS configured for production domain
- [ ] Rate limits configured
- [ ] Redis password set (production)

### Database
- [ ] MongoDB instance set up (Atlas or self-hosted)
- [ ] Connection string configured
- [ ] Indexes created (automatic with Mongoose)
- [ ] Backups configured (automatic with Atlas)

### Email
- [ ] SMTP credentials verified
- [ ] Email sending tested
- [ ] Email templates reviewed
- [ ] From address configured

### Monitoring
- [ ] Logging configured
- [ ] Error tracking set up (Sentry, etc.)
- [ ] Health check endpoint working
- [ ] Alerts configured

## Post-Deployment

### Testing
```bash
# Test health check
curl https://your-domain.com/api/v1/health

# Test registration
curl -X POST https://your-domain.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!"}'
```

### Monitoring
- Check logs regularly
- Monitor error rates
- Track response times
- Monitor Redis memory usage

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check REDIS_HOST and REDIS_PORT
   - Verify Redis is running
   - Check firewall rules

2. **Email Not Sending**
   - Verify SMTP credentials
   - Check spam folder
   - Test with different email service

3. **JWT Errors**
   - Ensure JWT_SECRET is set
   - Check token expiration times
   - Verify token format

4. **Rate Limit Issues**
   - Check Redis connection
   - Verify rate limit configuration
   - Clear Redis cache if needed

## Scaling

### Horizontal Scaling
- Deploy multiple instances
- Use load balancer
- Share Redis instance
- Session persistence enabled

### Vertical Scaling
- Increase server resources
- Optimize Redis memory
- Increase connection pools
- Enable caching

## Backup Strategy

### Database
- MongoDB Atlas: Automated backups included
- Self-hosted: Use mongodump/mongorestore
- Test restore procedures regularly

### Redis
- Enable persistence (AOF)
- Regular snapshots
- Replicas for HA

## Security Recommendations

1. Use environment variable secrets management
2. Enable HTTPS only
3. Set up WAF (Web Application Firewall)
4. Regular security audits
5. Keep dependencies updated
6. Monitor for vulnerabilities
7. Use strong passwords
8. Enable 2FA for admin access

## Performance Optimization

1. Enable compression
2. Use CDN for static assets
3. Implement caching strategy
4. Optimize database queries
5. Use connection pooling
6. Monitor memory usage
7. Profile slow endpoints

## Maintenance

### Regular Tasks
- Update dependencies monthly
- Review logs weekly
- Check error rates daily
- Test backups monthly
- Security audit quarterly

### Monitoring Metrics
- Response time (< 100ms target)
- Error rate (< 1% target)
- Uptime (99.9% target)
- Memory usage
- Redis hit rate
- API usage patterns

## Support

For deployment issues:
1. Check logs first
2. Review documentation
3. Contact DevOps team
4. Open support ticket

---

**Your authentication backend is ready for production! 🚀**

# 🚀 Aswan Food Delivery - Deployment Guide

This guide will help you deploy the Aswan Food Delivery application to Railway (backend) and Vercel (frontend).

## 📋 Prerequisites

### Required Tools
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) (optional, for local development)
- [Railway CLI](https://docs.railway.app/develop/cli) - `npm install -g @railway/cli`
- [Vercel CLI](https://vercel.com/cli) - `npm install -g vercel`

### Accounts
- [Railway](https://railway.app/) account (for backend hosting)
- [Vercel](https://vercel.com/) account (for frontend hosting)
- [MongoDB Atlas](https://www.mongodb.com/atlas) or [PostgreSQL](https://www.postgresql.org/) (for database)

## 🏗️ Project Structure

```
aswan-food-delivery/
├── client/                 # React frontend
│   ├── src/
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express backend
│   ├── src/
│   ├── prisma/
│   ├── Dockerfile
│   └── env.example
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── deploy.sh              # Linux/Mac deployment script
└── deploy.bat             # Windows deployment script
```

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Windows:
```cmd
deploy.bat
```

### Option 2: Manual Deployment

## 📦 Backend Deployment (Railway)

### 1. Prepare Backend
```bash
cd server
cp env.example .env
# Edit .env with your actual values
```

### 2. Deploy to Railway
```bash
# Login to Railway
railway login

# Initialize project (if first time)
railway init

# Deploy
railway up --detach
```

### 3. Configure Environment Variables
In Railway dashboard, set these environment variables:
- `DATABASE_URL` - Your database connection string
- `JWT_SECRET` - A secure random string
- `JWT_REFRESH_SECRET` - Another secure random string
- `CLIENT_URL` - Your frontend URL
- `NODE_ENV=production`

### 4. Database Setup
```bash
# Connect to your database and run migrations
railway connect
npx prisma migrate deploy
npx prisma db seed
```

## 🌐 Frontend Deployment (Vercel)

### 1. Prepare Frontend
```bash
cd client
# Create .env file
echo "REACT_APP_API_URL=https://your-railway-url.railway.app/api" > .env
echo "REACT_APP_ENV=production" >> .env
```

### 2. Deploy to Vercel
```bash
# Login to Vercel
vercel login

# Deploy
vercel --prod
```

## 🐳 Docker Deployment (Alternative)

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### Production
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔧 Environment Variables

### Backend (.env)
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/aswan_food_db"

# JWT
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"

# Server
PORT=5000
NODE_ENV=production
CLIENT_URL=https://your-frontend-domain.com

# Redis (optional)
REDIS_URL="redis://localhost:6379"
```

### Frontend (.env)
```env
REACT_APP_API_URL=https://your-backend-domain.com/api
REACT_APP_ENV=production
```

## 📊 Database Options

### Option 1: PostgreSQL (Recommended)
- **Railway PostgreSQL**: Add PostgreSQL service in Railway dashboard
- **Supabase**: Free tier available
- **Neon**: Serverless PostgreSQL

### Option 2: MongoDB Atlas
- **Atlas**: Free tier available
- Update `DATABASE_URL` to MongoDB connection string
- Update Prisma schema to use MongoDB

## 🔍 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Clear node_modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

2. **Database Connection Issues**
   ```bash
   # Test connection
   railway connect
   npx prisma db push
   ```

3. **Environment Variables**
   ```bash
   # Check Railway environment
   railway variables
   ```

4. **Frontend API Issues**
   ```bash
   # Check CORS settings in backend
   # Verify REACT_APP_API_URL in frontend
   ```

### Logs and Monitoring

#### Railway
```bash
# View logs
railway logs

# Check status
railway status

# Connect to database
railway connect
```

#### Vercel
```bash
# View logs
vercel logs

# Check status
vercel status
```

## 🚀 Performance Optimization

### Backend
- Enable Redis caching
- Use CDN for static assets
- Implement rate limiting
- Database indexing

### Frontend
- Enable gzip compression
- Use CDN for assets
- Implement lazy loading
- Optimize images

## 🔒 Security Checklist

- [ ] Use HTTPS in production
- [ ] Set secure JWT secrets
- [ ] Enable CORS properly
- [ ] Use environment variables
- [ ] Enable rate limiting
- [ ] Validate all inputs
- [ ] Use prepared statements
- [ ] Enable security headers

## 📈 Monitoring and Analytics

### Recommended Tools
- **Railway**: Built-in monitoring
- **Vercel**: Built-in analytics
- **Sentry**: Error tracking
- **Google Analytics**: User analytics

## 🆘 Support

If you encounter issues:
1. Check the logs: `railway logs` or `vercel logs`
2. Verify environment variables
3. Test database connection
4. Check CORS settings
5. Review the troubleshooting section above

## 📝 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)

---

**Happy Deploying! 🎉**


# 🚀 Aswan Food Delivery - MERN Stack Deployment Guide

## 📋 Overview

This project has been successfully converted to a full MERN stack application with the following components:

- **Frontend**: React + TypeScript + Redux Toolkit
- **Backend**: Express + TypeScript + Prisma + PostgreSQL
- **Database**: PostgreSQL (with Prisma ORM)
- **Deployment**: Railway (Backend) + Vercel (Frontend)
- **Containerization**: Docker support for development and production

## 🏗️ Project Structure

```
aswan-food-delivery/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services (with fallback to mock)
│   │   ├── store/         # Redux store
│   │   ├── types/         # TypeScript types
│   │   └── data/          # Runtime data stores
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Route controllers
│   │   ├── middleware/    # Express middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── prisma/            # Database schema and migrations
│   ├── Dockerfile
│   └── env.example
├── docker-compose.yml      # Development environment
├── docker-compose.prod.yml # Production environment
├── deploy.sh              # Linux/Mac deployment script
├── deploy.bat             # Windows deployment script
└── DEPLOYMENT.md          # Detailed deployment guide
```

## 🚀 Quick Start

### Prerequisites

1. **Node.js** (v18 or higher)
2. **Docker** (optional, for containerized development)
3. **Railway CLI**: `npm install -g @railway/cli`
4. **Vercel CLI**: `npm install -g vercel`

### Development Setup

#### Option 1: Docker (Recommended)
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

#### Option 2: Manual Setup
```bash
# Backend
cd server
npm install
cp env.example .env
# Edit .env with your database URL
npm run dev

# Frontend (in another terminal)
cd client
npm install
npm start
```

## 🌐 Production Deployment

### Backend Deployment (Railway)

1. **Prepare Environment**:
   ```bash
   cd server
   cp env.example .env
   # Edit .env with production values
   ```

2. **Deploy to Railway**:
   ```bash
   railway login
   railway init
   railway up --detach
   ```

3. **Configure Environment Variables** in Railway dashboard:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Secure random string
   - `JWT_REFRESH_SECRET` - Another secure random string
   - `CLIENT_URL` - Your frontend URL
   - `NODE_ENV=production`

4. **Database Setup**:
   ```bash
   railway connect
   npx prisma migrate deploy
   npx prisma db seed
   ```

### Frontend Deployment (Vercel)

1. **Prepare Environment**:
   ```bash
   cd client
   echo "REACT_APP_API_URL=https://your-railway-url.railway.app/api" > .env
   echo "REACT_APP_ENV=production" >> .env
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel login
   vercel --prod
   ```

### Automated Deployment

#### Linux/Mac:
```bash
chmod +x deploy.sh
./deploy.sh
```

#### Windows:
```cmd
deploy.bat
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

## 🔍 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh token

### Restaurants
- `GET /api/restaurants` - Get all restaurants
- `GET /api/restaurants/:id` - Get restaurant by ID
- `GET /api/restaurants/:id/menu` - Get restaurant menu
- `GET /api/restaurants/search/:query` - Search restaurants

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/users` - Create user
- `PUT /api/admin/users/:id` - Update user
- `DELETE /api/admin/users/:id` - Delete user
- `GET /api/admin/restaurants` - Get all restaurants
- `POST /api/admin/restaurants` - Create restaurant
- `PUT /api/admin/restaurants/:id` - Update restaurant
- `DELETE /api/admin/restaurants/:id` - Delete restaurant

## 🐳 Docker Commands

### Development
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production
```bash
# Start production services
docker-compose -f docker-compose.prod.yml up -d

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- CORS protection
- Rate limiting
- Input validation with Joi
- SQL injection protection with Prisma
- XSS protection with Helmet
- CSRF protection

## 📈 Performance Optimizations

### Backend
- Redis caching
- Database indexing
- Connection pooling
- Compression middleware
- Rate limiting

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN integration
- Service worker (PWA ready)

## 🆘 Troubleshooting

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

## 📝 Development Workflow

1. **Local Development**: Use Docker Compose for full stack
2. **API Testing**: Use Postman or similar tools
3. **Database Management**: Use Prisma Studio
4. **Code Quality**: ESLint + Prettier
5. **Testing**: Jest + React Testing Library

## 🎯 Next Steps

1. **Add Real-time Features**: Socket.IO for live updates
2. **Payment Integration**: Stripe or similar
3. **Push Notifications**: Firebase Cloud Messaging
4. **Analytics**: Google Analytics or similar
5. **Monitoring**: Sentry for error tracking
6. **CI/CD**: GitHub Actions for automated deployment

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app/)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Docker Documentation](https://docs.docker.com/)
- [React Documentation](https://reactjs.org/docs)
- [Express Documentation](https://expressjs.com/)

---

**Happy Deploying! 🎉**

The application now supports both mock data (for development) and real API (for production) with automatic fallback, making it easy to develop locally and deploy to production seamlessly.
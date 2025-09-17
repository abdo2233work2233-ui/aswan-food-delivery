# 🍽️ Aswan Food Delivery - Complete MERN Stack Application

A comprehensive food delivery application built with MongoDB Atlas, Express.js, React.js, and Node.js, featuring role-based access control and real-time updates.

## 🚀 Live Demo
- **Frontend**: [Deploy on Vercel](https://vercel.com)
- **Backend**: [Deploy on Render.com](https://render.com)
- **Database**: MongoDB Atlas

## ✨ Features

### 🔐 Authentication & Authorization
- JWT-based authentication
- Role-based access control (Customer, Owner, Driver, Admin)
- Secure password hashing with bcrypt
- Protected routes and middleware

### 👥 User Roles & Dashboards
- **Customer Dashboard**: Order management, profile, favorites
- **Restaurant Owner Dashboard**: Menu management, order tracking, analytics
- **Delivery Driver Dashboard**: Order pickup, delivery tracking, earnings
- **Admin Dashboard**: User management, restaurant approval, system analytics

### 🍕 Restaurant & Menu Management
- Restaurant listings with filters (rating, cuisine, delivery time)
- Dynamic menu management with categories
- Real-time menu updates
- Image upload support
- Calorie range filtering

### 🛒 Order Management
- Shopping cart functionality
- Order tracking with real-time updates
- Multiple payment methods
- Order history and status updates
- Delivery time estimation

### 🔍 Advanced Search
- Professional search bar with suggestions
- Filter by cuisine, rating, delivery time
- Calorie range filtering
- Search across restaurants and menu items

### 🌐 Internationalization
- Arabic and English support
- RTL layout support
- Dynamic language switching

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Redux Toolkit** for state management
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **React Icons** for UI icons
- **i18next** for internationalization

### Backend
- **Node.js** with Express.js
- **TypeScript** for type safety
- **Prisma ORM** with MongoDB
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Socket.IO** for real-time communication
- **Redis** for caching and rate limiting

### Database
- **MongoDB Atlas** (Cloud Database)
- **Prisma** as ORM
- **Redis** for caching

### DevOps & Deployment
- **Docker** for containerization
- **Render.com** for backend deployment
- **Vercel** for frontend deployment
- **GitHub Actions** for CI/CD

## 📁 Project Structure

```
aswan-food-delivery/
├── client/                 # React Frontend
│   ├── src/
│   │   ├── components/     # Reusable components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API services
│   │   ├── store/         # Redux store
│   │   ├── types/         # TypeScript types
│   │   └── utils/         # Utility functions
│   └── public/            # Static assets
├── server/                 # Express Backend
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   └── prisma/            # Database schema
├── docker-compose.yml     # Docker configuration
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- MongoDB Atlas account
- Git

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/aswan-food-delivery.git
cd aswan-food-delivery
```

### 2. Backend Setup
```bash
cd server
npm install
cp env.example .env
# Update .env with your MongoDB Atlas connection string
npm run dev
```

### 3. Frontend Setup
```bash
cd client
npm install
npm start
```

### 4. Database Setup
```bash
cd server
npx prisma generate
npx prisma db push
```

## 🌐 Deployment

### Backend (Render.com)
1. Connect your GitHub repository to Render
2. Create a new Web Service
3. Set Root Directory to `server`
4. Add environment variables:
   - `DATABASE_URL`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Your JWT secret key
   - `NODE_ENV`: production

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set Root Directory to `client`
3. Add environment variable:
   - `REACT_APP_API_URL`: Your Render backend URL

## 🔧 Environment Variables

### Server (.env)
```env
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/aswan_food_db"
JWT_SECRET="your-super-secret-jwt-key"
JWT_REFRESH_SECRET="your-super-secret-refresh-key"
NODE_ENV="production"
PORT=5000
```

### Client (.env)
```env
REACT_APP_API_URL="https://your-backend-url.onrender.com/api"
```

## 📊 Database Schema

The application uses MongoDB with the following main collections:
- **Users**: Customer, Owner, Driver, Admin accounts
- **Restaurants**: Restaurant information and settings
- **Categories**: Menu categories for each restaurant
- **MenuItems**: Individual menu items with pricing
- **Orders**: Order details and status tracking
- **Reviews**: Customer reviews and ratings

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting to prevent abuse
- Input validation and sanitization
- CORS configuration
- Helmet.js for security headers

## 🌍 Internationalization

The application supports both Arabic and English:
- Dynamic language switching
- RTL layout support for Arabic
- Localized content and messages
- Currency and date formatting

## 📱 Responsive Design

- Mobile-first approach
- Responsive layouts for all screen sizes
- Touch-friendly interface
- Optimized for mobile ordering

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**abdo2233work2233**
- GitHub: [@abdo2233work2233](https://github.com/abdo2233work2233)

## 🙏 Acknowledgments

- MongoDB Atlas for cloud database
- Render.com for backend hosting
- Vercel for frontend hosting
- All open-source libraries and frameworks used

---

**Ready for Production Deployment! 🚀**
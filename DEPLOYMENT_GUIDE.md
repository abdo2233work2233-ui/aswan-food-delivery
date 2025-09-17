# Render.com Deployment Guide

## 1. إنشاء حساب على Render.com
- اذهب إلى https://render.com
- سجل حساب جديد (مجاني)
- اربط حساب GitHub

## 2. رفع الكود إلى GitHub
```bash
# في مجلد المشروع الرئيسي
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/aswan-food-delivery.git
git push -u origin main
```

## 3. إنشاء Web Service على Render
- اذهب إلى Render Dashboard
- اضغط "New +" → "Web Service"
- اختر Repository: aswan-food-delivery
- Root Directory: server
- Build Command: npm install && npm run build
- Start Command: npm start
- Environment Variables:
  - DATABASE_URL: mongodb+srv://work23abdo23_db_user:mOFAZbgfzCpWMpIk@cluster0.wohgveh.mongodb.net/aswan_food_db?retryWrites=true&w=majority&appName=Cluster0
  - JWT_SECRET: aswan-food-super-secret-jwt-key-2024
  - JWT_REFRESH_SECRET: aswan-food-super-secret-refresh-key-2024
  - NODE_ENV: production
  - PORT: 5000

## 4. نشر Frontend على Vercel
- اذهب إلى https://vercel.com
- اربط حساب GitHub
- اضغط "New Project"
- اختر Repository: aswan-food-delivery
- Root Directory: client
- Build Command: npm run build
- Output Directory: build
- Environment Variables:
  - REACT_APP_API_URL: https://your-render-app.onrender.com/api
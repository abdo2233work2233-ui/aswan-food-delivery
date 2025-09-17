# Vercel API Routes Deployment

## 1. إنشاء ملف vercel.json في مجلد server
```json
{
  "version": 2,
  "builds": [
    {
      "src": "src/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/(.*)",
      "dest": "src/index.ts"
    }
  ],
  "env": {
    "DATABASE_URL": "mongodb+srv://work23abdo23_db_user:mOFAZbgfzCpWMpIk@cluster0.wohgveh.mongodb.net/aswan_food_db?retryWrites=true&w=majority&appName=Cluster0",
    "JWT_SECRET": "aswan-food-super-secret-jwt-key-2024",
    "JWT_REFRESH_SECRET": "aswan-food-super-secret-refresh-key-2024",
    "NODE_ENV": "production"
  }
}
```

## 2. تحديث package.json
```json
{
  "scripts": {
    "vercel-build": "npm run build",
    "start": "node dist/index.js"
  }
}
```

## 3. نشر على Vercel
```bash
# تثبيت Vercel CLI
npm install -g vercel

# نشر المشروع
vercel --prod
```

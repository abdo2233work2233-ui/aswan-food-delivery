# 🔧 Environment Variables for Render.com Frontend Deployment

## 📋 **Environment Variables المطلوبة في Render**:

### **1. REACT_APP_API_URL**
```
https://aswan-food-delivery.onrender.com
```

### **2. REACT_APP_SOCKET_URL**
```
https://aswan-food-delivery.onrender.com
```

### **3. REACT_APP_ENVIRONMENT**
```
production
```

### **4. REACT_APP_VERSION**
```
1.0.0
```

## 🚀 **كيفية إضافة Environment Variables في Render**:

### **الخطوات**:
1. اذهب إلى **Render Dashboard**
2. اختر مشروع الـ **Frontend**
3. اضغط على **"Environment"** في القائمة الجانبية
4. اضغط **"Add Environment Variable"**
5. أضف كل متغير كما هو موضح أعلاه

### **مثال**:
- **Key**: `REACT_APP_API_URL`
- **Value**: `https://aswan-food-delivery.onrender.com`

## ⚠️ **ملاحظات مهمة**:

1. **لا تضيف ملف .env** - Render يستخدم Environment Variables مباشرة
2. **تأكد من أن جميع المتغيرات تبدأ بـ `REACT_APP_`**
3. **لا تضع مسافات حول علامة `=`**
4. **تأكد من أن الـ URLs صحيحة ومتاحة**

## 🔍 **للتحقق من صحة الإعداد**:

بعد النشر، يمكنك التحقق من:
- **Frontend URL**: `https://your-frontend-name.onrender.com`
- **API Connection**: يجب أن يعمل البحث والمطاعم
- **Socket Connection**: يجب أن يعمل التحديث المباشر

## 📞 **إذا واجهت مشاكل**:

1. تحقق من **Render Logs**
2. تأكد من أن جميع Environment Variables مضبوطة
3. تأكد من أن الـ Backend يعمل على `https://aswan-food-delivery.onrender.com`

# سیستم آزمون آنلاین با امتیازدهی

پروژه کامل سیستم آزمون آنلاین با معماری Serverless برای Vercel

## 📋 ویژگی‌ها

- ✅ احراز هویت با JWT
- ✅ ثبت‌نام و ورود کاربران
- ✅ آزمون‌های چندگزینه‌ای با محدودیت زمانی
- ✅ سیستم امتیازدهی خودکار
- ✅ رتبه‌بندی کاربران
- ✅ پنل مدیریت Admin
- ✅ مدیریت سوالات، کاربران و نتایج

## 🏗️ معماری

پروژه به صورت **Serverless** پیاده‌سازی شده و از **Vercel API Routes** استفاده می‌کند:

- **Frontend**: HTML, CSS, JavaScript (Vanilla) + Tailwind CSS
- **Backend**: Node.js Serverless Functions
- **Database**: MongoDB Atlas
- **Authentication**: JWT (JSON Web Token)
- **Password Hashing**: bcryptjs

## 📁 ساختار پروژه

```
/
├── api/                    # Vercel Serverless Functions
│   ├── auth/
│   │   ├── login.js      # POST - ورود کاربر
│   │   └── register.js   # POST - ثبت‌نام کاربر
│   ├── exam/
│   │   ├── questions.js  # GET - دریافت سوالات
│   │   ├── submit.js     # POST - ارسال پاسخ‌ها
│   │   └── results.js    # GET - نتایج کاربر
│   ├── admin/
│   │   ├── questions.js  # GET/POST - مدیریت سوالات
│   │   ├── users.js      # GET - لیست کاربران
│   │   └── results.js    # GET - نتایج همه آزمون‌ها
│   ├── leaderboard.js    # GET - رتبه‌بندی
│   ├── db.js             # اتصال MongoDB
│   └── utils/
│       └── auth.js       # Middleware JWT
├── public/                # فایل‌های Frontend
│   ├── index.html        # صفحه اصلی
│   ├── login.html        # صفحه ورود
│   ├── register.html     # صفحه ثبت‌نام
│   ├── dashboard.html    # داشبورد کاربر
│   ├── exam.html         # صفحه آزمون
│   ├── admin.html        # پنل مدیریت
│   ├── leaderboard.html  # رتبه‌بندی
│   ├── css/
│   │   └── style.css     # استایل‌های سفارشی
│   └── js/
│       ├── auth.js       # مدیریت احراز هویت
│       ├── exam.js       # منطق آزمون
│       └── admin.js      # منطق پنل Admin
├── package.json          # وابستگی‌ها
├── vercel.json           # تنظیمات Vercel
└── README.md             # این فایل
```

## 🚀 نصب و راه‌اندازی

### پیش‌نیازها

- Node.js (نسخه 14 یا بالاتر)
- حساب MongoDB Atlas
- حساب Vercel (برای Deploy)

### 1. کلون کردن پروژه

```bash
git clone <repository-url>
cd online-exam-system
```

### 2. نصب وابستگی‌ها

```bash
npm install
```

### 3. تنظیم Environment Variables

یک فایل `.env.local` در ریشه پروژه ایجاد کنید:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DB_NAME=online_exam
```

**نکته**: برای MongoDB Atlas:
1. به [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) بروید
2. یک Cluster رایگان ایجاد کنید
3. یک Database User ایجاد کنید
4. Network Access را تنظیم کنید (0.0.0.0/0 برای همه IPها)
5. Connection String را کپی کنید

### 4. اجرای Local (با Vercel CLI)

```bash
# نصب Vercel CLI (اگر نصب نشده)
npm i -g vercel

# اجرای پروژه
vercel dev
```

یا با npm:

```bash
npm run dev
```

پروژه روی `http://localhost:3000` اجرا می‌شود.

## 📦 Deploy روی Vercel

### روش 1: از طریق CLI

```bash
# نصب Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel
```

### روش 2: از طریق GitHub

1. پروژه را روی GitHub Push کنید
2. به [Vercel Dashboard](https://vercel.com/dashboard) بروید
3. روی "New Project" کلیک کنید
4. Repository را انتخاب کنید
5. Environment Variables را اضافه کنید:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `DB_NAME` (اختیاری)
6. روی "Deploy" کلیک کنید

### تنظیم Environment Variables در Vercel

1. به Project Settings بروید
2. به بخش Environment Variables بروید
3. متغیرهای زیر را اضافه کنید:
   - `MONGODB_URI`: Connection String MongoDB Atlas
   - `JWT_SECRET`: یک رشته تصادفی و امن (مثلاً با `openssl rand -base64 32`)
   - `DB_NAME`: نام دیتابیس (پیش‌فرض: `online_exam`)

## 📊 مدل‌های دیتابیس

### User Collection

```javascript
{
  _id: ObjectId,
  username: String (unique),
  email: String (unique),
  password: String (hashed),
  role: String ('user' | 'admin'),
  totalScore: Number (default: 0),
  createdAt: Date
}
```

**نکته**: اولین کاربر ثبت‌نام شده به صورت خودکار `admin` می‌شود.

### Question Collection

```javascript
{
  _id: ObjectId,
  question: String,
  options: [String] (4 گزینه),
  correctAnswer: Number (0-3, index),
  createdAt: Date
}
```

### Result Collection

```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: User),
  score: Number (0-100),
  correctAnswers: Number,
  totalQuestions: Number,
  date: Date
}
```

## 🔐 امنیت

- پسوردها با **bcryptjs** (10 salt rounds) هش می‌شوند
- JWT Token در **Authorization Header** ارسال می‌شود: `Bearer <token>`
- Token ها 7 روز اعتبار دارند
- پاسخ صحیح سوالات در API سوالات نمایش داده نمی‌شود
- دسترسی Admin با بررسی `role` در JWT کنترل می‌شود

## 🎯 API Endpoints

### احراز هویت

- `POST /api/auth/register` - ثبت‌نام
- `POST /api/auth/login` - ورود

### آزمون

- `GET /api/exam/questions` - دریافت سوالات (نیاز به JWT)
- `POST /api/exam/submit` - ارسال پاسخ‌ها (نیاز به JWT)
- `GET /api/exam/results` - نتایج کاربر (نیاز به JWT)

### Admin

- `GET /api/admin/questions` - لیست سوالات (نیاز به Admin)
- `POST /api/admin/questions` - افزودن سوال (نیاز به Admin)
- `GET /api/admin/users` - لیست کاربران (نیاز به Admin)
- `GET /api/admin/results` - نتایج همه آزمون‌ها (نیاز به Admin)

### عمومی

- `GET /api/leaderboard` - رتبه‌بندی (بدون نیاز به JWT)

## 📱 صفحات Frontend

- `/index.html` - صفحه اصلی
- `/login.html` - ورود
- `/register.html` - ثبت‌نام
- `/dashboard.html` - داشبورد کاربر
- `/exam.html` - صفحه آزمون (30 دقیقه)
- `/admin.html` - پنل مدیریت
- `/leaderboard.html` - رتبه‌بندی

## 🛠️ توسعه

### افزودن سوال جدید (از طریق Admin Panel)

1. با حساب Admin وارد شوید
2. به تب "مدیریت سوالات" بروید
3. فرم را پر کنید و سوال را اضافه کنید

### تغییر محدودیت زمانی آزمون

فایل `public/js/exam.js` را ویرایش کنید:

```javascript
let timeLeft = 30 * 60; // تغییر به ثانیه مورد نظر
```

### تغییر اعتبار JWT

فایل‌های API را ویرایش کنید و `expiresIn` را تغییر دهید:

```javascript
jwt.sign(payload, secret, { expiresIn: '7d' }); // تغییر به زمان مورد نظر
```

## 🐛 عیب‌یابی

### خطای اتصال به MongoDB

- بررسی کنید که `MONGODB_URI` صحیح است
- IP خود را در MongoDB Atlas Whitelist کنید
- بررسی کنید که Database User درست است

### خطای 401 (Unauthorized)

- بررسی کنید که Token در localStorage ذخیره شده است
- Token ممکن است منقضی شده باشد (7 روز)
- دوباره وارد شوید

### خطای 403 (Forbidden)

- بررسی کنید که کاربر `role: 'admin'` دارد
- اولین کاربر ثبت‌نام شده Admin می‌شود

## 📝 نکات مهم

- در Production حتماً `JWT_SECRET` قوی و تصادفی تنظیم کنید
- MongoDB Atlas را به IP های مجاز محدود کنید
- از HTTPS استفاده کنید (Vercel به صورت خودکار)
- پسوردها هش می‌شوند و قابل بازیابی نیستند
- اولین کاربر به صورت خودکار Admin می‌شود

## 📄 لایسنس

این پروژه برای استفاده آموزشی و پروژه‌های دانشجویی طراحی شده است.

## 👨‍💻 توسعه‌دهنده

پروژه دانشجویی - سیستم آزمون آنلاین

---

**موفق باشید! 🚀**


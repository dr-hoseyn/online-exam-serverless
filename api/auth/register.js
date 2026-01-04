// API Route برای ثبت‌نام کاربر جدید
const { connectToDatabase } = require('../db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

module.exports = async (req, res) => {
  // فقط POST method مجاز است
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username, email, password } = req.body;

    // اعتبارسنجی ورودی‌ها
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'لطفاً تمام فیلدها را پر کنید' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'رمز عبور باید حداقل 6 کاراکتر باشد' });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // بررسی تکراری نبودن username و email
    const existingUser = await usersCollection.findOne({
      $or: [{ username }, { email }]
    });

    if (existingUser) {
      return res.status(400).json({ error: 'نام کاربری یا ایمیل قبلاً استفاده شده است' });
    }

    // هش کردن پسورد
    const hashedPassword = await bcrypt.hash(password, 10);

    // بررسی اینکه آیا این اولین کاربر است (Admin می‌شود)
    const userCount = await usersCollection.countDocuments();
    const role = userCount === 0 ? 'admin' : 'user';

    // ایجاد کاربر جدید
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role,
      totalScore: 0,
      createdAt: new Date()
    };

    const result = await usersCollection.insertOne(newUser);

    // تولید JWT Token
    const token = jwt.sign(
      { userId: result.insertedId.toString(), username, role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'ثبت‌نام با موفقیت انجام شد',
      token,
      user: {
        id: result.insertedId.toString(),
        username,
        email,
        role
      }
    });
  } catch (error) {
    console.error('خطا در ثبت‌نام:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت‌نام' });
  }
};


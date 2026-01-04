// API Route برای ورود کاربر
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
    const { username, password } = req.body;

    // اعتبارسنجی ورودی‌ها
    if (!username || !password) {
      return res.status(400).json({ error: 'لطفاً نام کاربری و رمز عبور را وارد کنید' });
    }

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // جستجوی کاربر با username یا email
    const user = await usersCollection.findOne({
      $or: [{ username }, { email: username }]
    });

    if (!user) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // بررسی پسورد
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'نام کاربری یا رمز عبور اشتباه است' });
    }

    // تولید JWT Token
    const token = jwt.sign(
      { userId: user._id.toString(), username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      message: 'ورود موفقیت‌آمیز بود',
      token,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        role: user.role,
        totalScore: user.totalScore || 0
      }
    });
  } catch (error) {
    console.error('خطا در ورود:', error);
    res.status(500).json({ error: 'خطای سرور در ورود' });
  }
};


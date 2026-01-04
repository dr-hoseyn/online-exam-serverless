// API Route برای مشاهده لیست کاربران (Admin)
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');

module.exports = async (req, res) => {
  // فقط GET method مجاز است
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // بررسی احراز هویت و دسترسی Admin
    const user = requireAuth(req, res, true); // requireAdmin = true
    if (!user) return;

    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // دریافت همه کاربران (بدون پسورد)
    const users = await usersCollection
      .find({})
      .project({ password: 0 }) // حذف پسورد از خروجی
      .sort({ totalScore: -1, createdAt: -1 })
      .toArray();

    // فرمت کردن کاربران
    const formattedUsers = users.map(u => ({
      id: u._id.toString(),
      username: u.username,
      email: u.email,
      role: u.role,
      totalScore: u.totalScore || 0,
      createdAt: u.createdAt
    }));

    res.status(200).json({
      users: formattedUsers,
      total: formattedUsers.length
    });
  } catch (error) {
    console.error('خطا در دریافت کاربران:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت کاربران' });
  }
};


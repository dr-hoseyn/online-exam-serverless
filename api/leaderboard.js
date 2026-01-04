// API Route برای رتبه‌بندی کاربران
const { connectToDatabase } = require('../db');
const { verifyToken } = require('./utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // فقط GET method مجاز است
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const usersCollection = db.collection('users');

    // دریافت 10 کاربر برتر بر اساس totalScore
    const topUsers = await usersCollection
      .find({})
      .project({ password: 0, email: 0 }) // حذف اطلاعات حساس
      .sort({ totalScore: -1 })
      .limit(10)
      .toArray();

    // فرمت کردن کاربران
    const formattedUsers = topUsers.map((u, index) => ({
      rank: index + 1,
      id: u._id.toString(),
      username: u.username,
      totalScore: u.totalScore || 0
    }));

    // بررسی اینکه آیا کاربر لاگین کرده است (برای نمایش رتبه خود)
    let userRank = null;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const decoded = verifyToken(authHeader);
      if (decoded) {
        const user = await usersCollection.findOne({
          _id: new ObjectId(decoded.userId)
        });

        if (user) {
          // محاسبه رتبه کاربر
          const usersAbove = await usersCollection.countDocuments({
            totalScore: { $gt: user.totalScore || 0 }
          });
          userRank = usersAbove + 1;
        }
      }
    }

    res.status(200).json({
      leaderboard: formattedUsers,
      userRank: userRank // null اگر لاگین نکرده باشد
    });
  } catch (error) {
    console.error('خطا در دریافت رتبه‌بندی:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت رتبه‌بندی' });
  }
};


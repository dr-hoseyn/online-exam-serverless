// API Route برای مشاهده نتایج همه آزمون‌ها (Admin)
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');
const { ObjectId } = require('mongodb');

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
    const resultsCollection = db.collection('results');
    const usersCollection = db.collection('users');

    // دریافت همه نتایج با اطلاعات کاربر
    const results = await resultsCollection
      .find({})
      .sort({ date: -1 })
      .toArray();

    // دریافت اطلاعات کاربران برای نمایش نام
    const userIds = [...new Set(results.map(r => r.userId.toString()))];
    const users = await usersCollection
      .find({ _id: { $in: userIds.map(id => new ObjectId(id)) } })
      .toArray();

    const usersMap = new Map();
    users.forEach(u => {
      usersMap.set(u._id.toString(), u);
    });

    // فرمت کردن نتایج با اطلاعات کاربر
    const formattedResults = results.map(r => {
      const user = usersMap.get(r.userId.toString());
      return {
        id: r._id.toString(),
        userId: r.userId.toString(),
        username: user ? user.username : 'نامشخص',
        email: user ? user.email : 'نامشخص',
        score: r.score,
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        date: r.date
      };
    });

    res.status(200).json({
      results: formattedResults,
      total: formattedResults.length
    });
  } catch (error) {
    console.error('خطا در دریافت نتایج:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت نتایج' });
  }
};


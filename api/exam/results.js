// API Route برای دریافت نتایج کاربر
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // فقط GET method مجاز است
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // بررسی احراز هویت
    const user = requireAuth(req, res);
    if (!user) return;

    const { db } = await connectToDatabase();
    const resultsCollection = db.collection('results');

    // دریافت نتایج کاربر
    const results = await resultsCollection
      .find({ userId: new ObjectId(user.userId) })
      .sort({ date: -1 }) // جدیدترین اول
      .toArray();

    // فرمت کردن نتایج
    const formattedResults = results.map(r => ({
      id: r._id.toString(),
      score: r.score,
      correctAnswers: r.correctAnswers,
      totalQuestions: r.totalQuestions,
      date: r.date
    }));

    res.status(200).json({
      results: formattedResults,
      total: formattedResults.length
    });
  } catch (error) {
    console.error('خطا در دریافت نتایج:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت نتایج' });
  }
};


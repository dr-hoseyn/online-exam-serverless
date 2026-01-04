// API Route برای دریافت سوالات آزمون
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');

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
    const questionsCollection = db.collection('questions');

    // دریافت همه سوالات (بدون نمایش پاسخ صحیح)
    const questions = await questionsCollection
      .find({})
      .project({ correctAnswer: 0 }) // حذف پاسخ صحیح از خروجی
      .toArray();

    // تبدیل _id به string برای Frontend
    const formattedQuestions = questions.map(q => ({
      id: q._id.toString(),
      question: q.question,
      options: q.options
    }));

    res.status(200).json({
      questions: formattedQuestions,
      total: formattedQuestions.length
    });
  } catch (error) {
    console.error('خطا در دریافت سوالات:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت سوالات' });
  }
};


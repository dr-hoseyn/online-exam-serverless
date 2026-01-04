// API Route برای ارسال پاسخ‌ها و محاسبه نمره
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // فقط POST method مجاز است
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // بررسی احراز هویت
    const user = requireAuth(req, res);
    if (!user) return;

    const { answers } = req.body; // answers: [{ questionId, answerIndex }]

    if (!answers || !Array.isArray(answers)) {
      return res.status(400).json({ error: 'فرمت پاسخ‌ها صحیح نیست' });
    }

    const { db } = await connectToDatabase();
    const questionsCollection = db.collection('questions');
    const resultsCollection = db.collection('results');
    const usersCollection = db.collection('users');

    // دریافت همه سوالات با پاسخ صحیح
    const allQuestions = await questionsCollection.find({}).toArray();

    if (allQuestions.length === 0) {
      return res.status(400).json({ error: 'هیچ سوالی در سیستم وجود ندارد' });
    }

    // ایجاد Map برای دسترسی سریع به سوالات
    const questionsMap = new Map();
    allQuestions.forEach(q => {
      questionsMap.set(q._id.toString(), q);
    });

    // محاسبه نمره
    let correctAnswers = 0;
    const totalQuestions = allQuestions.length;

    answers.forEach(({ questionId, answerIndex }) => {
      const question = questionsMap.get(questionId);
      if (question && question.correctAnswer === answerIndex) {
        correctAnswers++;
      }
    });

    const score = Math.round((correctAnswers / totalQuestions) * 100);

    // ذخیره نتیجه
    const result = {
      userId: new ObjectId(user.userId),
      score,
      correctAnswers,
      totalQuestions,
      date: new Date()
    };

    await resultsCollection.insertOne(result);

    // به‌روزرسانی totalScore کاربر
    await usersCollection.updateOne(
      { _id: new ObjectId(user.userId) },
      { $inc: { totalScore: score } }
    );

    // دریافت totalScore به‌روز شده
    const updatedUser = await usersCollection.findOne(
      { _id: new ObjectId(user.userId) }
    );

    res.status(200).json({
      message: 'آزمون با موفقیت ثبت شد',
      score,
      correctAnswers,
      totalQuestions,
      totalScore: updatedUser.totalScore || 0
    });
  } catch (error) {
    console.error('خطا در ثبت آزمون:', error);
    res.status(500).json({ error: 'خطای سرور در ثبت آزمون' });
  }
};


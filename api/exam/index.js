// API Route واحد برای عملیات آزمون (Exam)
// - GET ?results=1          → نتایج کاربر
// - GET ?courseId=...       → سوالات آزمون دوره مشخص
// - POST ?courseId=...      → ارسال پاسخ‌ها و محاسبه نمره

const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  // همه عملیات آزمون نیاز به احراز هویت دارند
  const user = requireAuth(req, res);
  if (!user) return;

  const { courseId, results } = req.query || {};

  try {
    const { db } = await connectToDatabase();
    const questionsCollection = db.collection('questions');
    const resultsCollection = db.collection('results');
    const usersCollection = db.collection('users');

    // 1) GET نتایج کاربر: /api/exam?results=1
    if (req.method === 'GET' && results === '1') {
      const userResults = await resultsCollection
        .find({ userId: new ObjectId(user.userId) })
        .sort({ date: -1 })
        .toArray();

      const formattedResults = userResults.map((r) => ({
        id: r._id.toString(),
        courseId: r.courseId ? r.courseId.toString() : null,
        score: r.score,
        correctAnswers: r.correctAnswers,
        totalQuestions: r.totalQuestions,
        date: r.date,
      }));

      return res.status(200).json({
        results: formattedResults,
        total: formattedResults.length,
      });
    }

    // از اینجا به بعد نیاز به courseId معتبر است
    if (!courseId) {
      return res.status(400).json({ error: 'courseId الزامی است' });
    }

    if (!ObjectId.isValid(courseId)) {
      return res.status(400).json({ error: 'courseId نامعتبر است' });
    }

    // 2) GET سوالات آزمون: /api/exam?courseId=...
    if (req.method === 'GET') {
      const questions = await questionsCollection
        .find({ courseId: new ObjectId(courseId) })
        .project({ correctAnswer: 0 }) // عدم ارسال پاسخ صحیح به Frontend
        .toArray();

      const formattedQuestions = questions.map((q) => ({
        id: q._id.toString(),
        question: q.question,
        options: q.options,
      }));

      return res.status(200).json({
        questions: formattedQuestions,
        total: formattedQuestions.length,
      });
    }

    // 3) POST ارسال پاسخ‌ها و محاسبه نمره: /api/exam?courseId=...
    if (req.method === 'POST') {
      const { answers } = req.body || {}; // answers: [{ questionId, answerIndex }]

      if (!answers || !Array.isArray(answers)) {
        return res.status(400).json({ error: 'فرمت پاسخ‌ها صحیح نیست' });
      }

      // دریافت سوالات مربوط به این دوره با پاسخ صحیح
      const allQuestions = await questionsCollection
        .find({ courseId: new ObjectId(courseId) })
        .toArray();

      if (allQuestions.length === 0) {
        return res
          .status(400)
          .json({ error: 'هیچ سوالی برای این دوره در سیستم وجود ندارد' });
      }

      // ایجاد Map برای دسترسی سریع به سوالات
      const questionsMap = new Map();
      allQuestions.forEach((q) => {
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
        courseId: new ObjectId(courseId),
        score,
        correctAnswers,
        totalQuestions,
        date: new Date(),
      };

      await resultsCollection.insertOne(result);

      // به‌روزرسانی totalScore کاربر
      await usersCollection.updateOne(
        { _id: new ObjectId(user.userId) },
        { $inc: { totalScore: score } }
      );

      // دریافت totalScore به‌روز شده
      const updatedUser = await usersCollection.findOne({
        _id: new ObjectId(user.userId),
      });

      return res.status(200).json({
        message: 'آزمون با موفقیت ثبت شد',
        score,
        correctAnswers,
        totalQuestions,
        totalScore: updatedUser.totalScore || 0,
      });
    }

    // سایر متدها
    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('خطا در API آزمون:', error);
    res.status(500).json({ error: 'خطای سرور در عملیات آزمون' });
  }
};



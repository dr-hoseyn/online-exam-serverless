// API Route برای مدیریت سوالات (Admin)
// هر سوال به یک دوره (course) وابسته است
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');
const { ObjectId } = require('mongodb');

module.exports = async (req, res) => {
  try {
    // بررسی احراز هویت و دسترسی Admin
    const user = requireAuth(req, res, true); // requireAdmin = true
    if (!user) return;

    const { db } = await connectToDatabase();
    const questionsCollection = db.collection('questions');
    const coursesCollection = db.collection('courses');

    // GET: دریافت همه سوالات
    if (req.method === 'GET') {
      const questions = await questionsCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      const formattedQuestions = questions.map((q) => ({
        id: q._id.toString(),
        courseId: q.courseId ? q.courseId.toString() : null,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        createdAt: q.createdAt,
      }));

      return res.status(200).json({
        questions: formattedQuestions,
        total: formattedQuestions.length,
      });
    }

    // POST: افزودن سوال جدید
    if (req.method === 'POST') {
      const { question, options, correctAnswer, courseId } = req.body || {};

      // اعتبارسنجی
      if (!question || !options || !Array.isArray(options) || options.length !== 4) {
        return res.status(400).json({ error: 'لطفاً سوال و 4 گزینه را وارد کنید' });
      }

      if (correctAnswer === undefined || correctAnswer < 0 || correctAnswer > 3) {
        return res.status(400).json({ error: 'پاسخ صحیح باید بین 0 تا 3 باشد' });
      }

      if (!courseId || !ObjectId.isValid(courseId)) {
        return res.status(400).json({ error: 'courseId معتبر ارسال کنید' });
      }

      // اطمینان از وجود دوره
      const course = await coursesCollection.findOne({
        _id: new ObjectId(courseId),
      });

      if (!course) {
        return res.status(404).json({ error: 'دوره مورد نظر یافت نشد' });
      }

      const newQuestion = {
        courseId: new ObjectId(courseId),
        question,
        options,
        correctAnswer: parseInt(correctAnswer),
        createdAt: new Date(),
      };

      const result = await questionsCollection.insertOne(newQuestion);

      return res.status(201).json({
        message: 'سوال با موفقیت افزوده شد',
        question: {
          id: result.insertedId.toString(),
          ...newQuestion,
        },
      });
    }

    // DELETE: حذف سوال
    if (req.method === 'DELETE') {
      const { questionId } = req.body;

      if (!questionId) {
        return res.status(400).json({ error: 'شناسه سوال را ارسال کنید' });
      }

      const result = await questionsCollection.deleteOne({
        _id: new ObjectId(questionId),
      });

      if (result.deletedCount === 0) {
        return res.status(404).json({ error: 'سوال یافت نشد' });
      }

      return res.status(200).json({ message: 'سوال با موفقیت حذف شد' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('خطا در مدیریت سوالات:', error);
    res.status(500).json({ error: 'خطای سرور در مدیریت سوالات' });
  }
};


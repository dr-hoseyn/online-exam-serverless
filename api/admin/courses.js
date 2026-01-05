// API Route برای مدیریت دوره‌ها (Courses) - فقط Admin
const { connectToDatabase } = require('../db');
const { requireAuth } = require('../utils/auth');

/**
 * GET /api/admin/courses
 * POST /api/admin/courses
 */
module.exports = async (req, res) => {
  try {
    // فقط Admin اجازه دسترسی دارد
    const user = requireAuth(req, res, true);
    if (!user) return;

    const { db } = await connectToDatabase();
    const coursesCollection = db.collection('courses');

    // GET: لیست دوره‌ها برای مدیریت
    if (req.method === 'GET') {
      const courses = await coursesCollection
        .find({})
        .sort({ createdAt: -1 })
        .toArray();

      const formatted = courses.map((c) => ({
        id: c._id.toString(),
        title: c.title,
        description: c.description,
        level: c.level,
        thumbnail: c.thumbnail,
        videoUrl: c.videoUrl,
        createdAt: c.createdAt,
      }));

      return res.status(200).json({ courses: formatted, total: formatted.length });
    }

    // POST: ایجاد دوره جدید
    if (req.method === 'POST') {
      const { title, description, level, thumbnail, content, videoUrl } = req.body || {};

      if (!title || !description || !level) {
        return res
          .status(400)
          .json({ error: 'عنوان، توضیحات و سطح دوره الزامی هستند' });
      }

      const allowedLevels = ['beginner', 'intermediate', 'advanced'];
      if (!allowedLevels.includes(level)) {
        return res
          .status(400)
          .json({ error: 'مقدار level نامعتبر است (beginner/intermediate/advanced)' });
      }

      const newCourse = {
        title,
        description,
        level,
        thumbnail: thumbnail || '',
        content: content || '',
        videoUrl: videoUrl || '',
        createdAt: new Date(),
      };

      const result = await coursesCollection.insertOne(newCourse);

      return res.status(201).json({
        message: 'دوره با موفقیت ایجاد شد',
        course: {
          id: result.insertedId.toString(),
          ...newCourse,
        },
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('خطا در مدیریت دوره‌ها:', error);
    res.status(500).json({ error: 'خطای سرور در مدیریت دوره‌ها' });
  }
};



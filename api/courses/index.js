// API Route برای لیست دوره‌ها (Courses)
const { connectToDatabase } = require('../db');

/**
 * GET /api/courses
 * لیست دوره‌ها را برمی‌گرداند.
 * پارامتر اختیاری: ?level=beginner|intermediate|advanced
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { db } = await connectToDatabase();
    const coursesCollection = db.collection('courses');

    const { level } = req.query || {};
    const filter = {};
    if (level) {
      filter.level = level;
    }

    // در لیست، محتوای بلند را ارسال نمی‌کنیم
    const courses = await coursesCollection
      .find(filter)
      .project({
        content: 0,
      })
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

    res.status(200).json({ courses: formatted, total: formatted.length });
  } catch (error) {
    console.error('خطا در دریافت دوره‌ها:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت دوره‌ها' });
  }
};



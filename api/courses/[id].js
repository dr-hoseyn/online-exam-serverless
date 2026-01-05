// API Route برای دریافت جزئیات یک دوره
const { connectToDatabase } = require('../db');
const { ObjectId } = require('mongodb');

/**
 * GET /api/courses/[id]
 * جزئیات یک Course را بر اساس id برمی‌گرداند.
 */
module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query || {};

    if (!id) {
      return res.status(400).json({ error: 'شناسه دوره الزامی است' });
    }

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'شناسه دوره نامعتبر است' });
    }

    const { db } = await connectToDatabase();
    const coursesCollection = db.collection('courses');

    const course = await coursesCollection.findOne({ _id: new ObjectId(id) });

    if (!course) {
      return res.status(404).json({ error: 'دوره یافت نشد' });
    }

    res.status(200).json({
      id: course._id.toString(),
      title: course.title,
      description: course.description,
      level: course.level,
      thumbnail: course.thumbnail,
      content: course.content,
      videoUrl: course.videoUrl,
      createdAt: course.createdAt,
    });
  } catch (error) {
    console.error('خطا در دریافت دوره:', error);
    res.status(500).json({ error: 'خطای سرور در دریافت دوره' });
  }
};



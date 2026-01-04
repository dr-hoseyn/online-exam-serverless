// اتصال MongoDB با Pattern Singleton برای Serverless
const { MongoClient } = require('mongodb');

let cachedClient = null;
let cachedDb = null;

// MongoDB URI از Environment Variables
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || 'online_exam';

if (!MONGODB_URI) {
  throw new Error('لطفاً متغیر محیطی MONGODB_URI را تنظیم کنید');
}

/**
 * اتصال به MongoDB با استفاده از Pattern Singleton
 * این الگو از ایجاد اتصال‌های متعدد در Serverless Functions جلوگیری می‌کند
 */
async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  try {
    const client = new MongoClient(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    await client.connect();
    const db = client.db(DB_NAME);

    cachedClient = client;
    cachedDb = db;

    console.log('اتصال به MongoDB برقرار شد');

    return { client, db };
  } catch (error) {
    console.error('خطا در اتصال به MongoDB:', error);
    throw error;
  }
}

module.exports = { connectToDatabase };


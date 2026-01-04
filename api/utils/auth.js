// Middleware برای بررسی JWT Token
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

/**
 * بررسی اعتبار JWT Token
 * @param {string} authHeader - Authorization header از request
 * @returns {object|null} - Decoded token یا null در صورت خطا
 */
function verifyToken(authHeader) {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7); // حذف "Bearer "

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware برای بررسی احراز هویت
 * @param {object} req - Request object
 * @param {object} res - Response object
 * @param {function} next - Next function
 * @param {boolean} requireAdmin - آیا نیاز به role admin است؟
 */
function requireAuth(req, res, requireAdmin = false) {
  const authHeader = req.headers.authorization;
  const decoded = verifyToken(authHeader);

  if (!decoded) {
    res.status(401).json({ error: 'لطفاً ابتدا وارد شوید' });
    return null;
  }

  if (requireAdmin && decoded.role !== 'admin') {
    res.status(403).json({ error: 'دسترسی محدود به مدیران' });
    return null;
  }

  return decoded;
}

module.exports = { verifyToken, requireAuth };


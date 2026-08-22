const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../database/db');

/**
 * Verifies JWT and attaches authenticated user and employee record to req.user
 */
async function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  jwt.verify(token, config.JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }

    try {
      // Fetch user details from DB
      const user = await db.prepare(`
        SELECT u.id, u.login_id, u.email, u.role, u.company_id, u.must_change_password, u.is_active,
               e.id as employee_id, e.first_name, e.last_name, e.job_position, e.department, e.profile_picture,
               c.name as company_name, c.code as company_code, c.logo_url as company_logo
        FROM users u
        LEFT JOIN employees e ON e.user_id = u.id
        LEFT JOIN companies c ON c.id = u.company_id
        WHERE u.id = ?
      `).get(decoded.id);

      if (!user || !user.is_active) {
        return res.status(401).json({ success: false, message: 'Account is inactive or not found' });
      }

      req.user = user;
      next();
    } catch (dbErr) {
      console.error('Auth middleware DB error:', dbErr);
      return res.status(500).json({ success: false, message: 'Authentication error' });
    }
  });
}

function requireAdminOrHR(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  if (req.user.role !== 'admin' && req.user.role !== 'hr') {
    return res.status(403).json({ success: false, message: 'Access forbidden: Admin or HR privileges required' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access forbidden: Admin privileges required' });
  }
  next();
}

module.exports = {
  authenticateToken,
  requireAdminOrHR,
  requireAdmin
};

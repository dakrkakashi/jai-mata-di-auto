/**
 * Admin Authentication Middleware
 * Validates JWT token from httpOnly cookie (canonical) or x-admin-token header (fallback).
 */

const jwt = require('jsonwebtoken');
const { JWT_SECRET, COOKIE_NAME } = require('../config');

function adminAuth(req, res, next) {
  const token = (req.cookies && req.cookies[COOKIE_NAME]) || req.headers['x-admin-token'];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Admin authentication required'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Unauthorized: Invalid or expired admin session'
    });
  }
}

module.exports = adminAuth;

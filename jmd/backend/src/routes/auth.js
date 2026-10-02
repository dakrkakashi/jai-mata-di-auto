const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { JWT_SECRET, ADMIN_PASSWORD, COOKIE_NAME, COOKIE_DOMAIN, COOKIE_SECURE, COOKIE_SAMESITE } = require('../config');
const { readJSON, writeJSON, logActivity } = require('../services/storage');
const { loginLimiter } = require('../middleware/rateLimit');
const adminAuth = require('../middleware/adminAuth');

router.post('/admin/login', loginLimiter, (req, res) => {
  const { password, rememberMe } = req.body || {};

  if (!password) {
    return res.status(400).json({ success: false, error: 'Password is required' });
  }

  const settings = readJSON('settings.json', {});
  const storedHash = settings.adminPassword;

  let isValid = false;
  if (storedHash && storedHash.startsWith('$2')) {
    isValid = bcrypt.compareSync(password, storedHash);
  } else if (ADMIN_PASSWORD) {
    isValid = (password === ADMIN_PASSWORD);
    // Auto-migrate to bcrypt hash if valid
    if (isValid) {
      settings.adminPassword = bcrypt.hashSync(password, 10);
      writeJSON('settings.json', settings);
    }
  }

  if (!isValid) {
    logActivity('Failed admin login attempt', { ip: req.ip });
    return res.status(401).json({ success: false, error: 'Invalid admin credentials' });
  }

  const expiresIn = rememberMe ? '30d' : '2h';
  const maxAge = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 2 * 60 * 60 * 1000;

  const token = jwt.sign({ user: 'admin' }, JWT_SECRET, { expiresIn });

  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE,
    maxAge
  };
  if (COOKIE_DOMAIN) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }

  res.cookie(COOKIE_NAME, token, cookieOptions);
  logActivity('Admin login success', { ip: req.ip });

  // Standardize auth: Token is in httpOnly cookie only, not returned in JSON response
  return res.json({
    success: true,
    message: 'Authenticated successfully'
  });
});

router.post('/admin/logout', (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: COOKIE_SECURE,
    sameSite: COOKIE_SAMESITE
  };
  if (COOKIE_DOMAIN) {
    cookieOptions.domain = COOKIE_DOMAIN;
  }

  res.clearCookie(COOKIE_NAME, cookieOptions);
  logActivity('Admin logout', { ip: req.ip });
  res.json({ success: true, message: 'Logged out successfully' });
});

router.get('/admin/check-auth', adminAuth, (req, res) => {
  res.json({
    success: true,
    authenticated: true,
    user: 'admin'
  });
});

module.exports = router;

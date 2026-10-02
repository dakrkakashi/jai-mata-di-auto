/**
 * CSRF Protection Middleware
 * Verifies Origin / Referer headers against allowed frontend origins for state-changing HTTP methods.
 */

const { ALLOWED_ORIGINS, IS_PROD } = require('../config');

function csrfProtection(req, res, next) {
  // Safe HTTP methods do not modify state
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  // Public lead submission is exempt from CSRF origin check because it's a public form from static CDN
  // (It is protected by honeypot and rate limiting instead)
  if (req.path === '/api/submit-lead') {
    return next();
  }

  const origin = req.headers['origin'] || req.headers['referer'];

  // If no origin/referer provided in production on a cookie-authenticated request, block
  if (!origin) {
    if (IS_PROD && req.cookies && req.cookies.jmd_admin) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Missing Origin/Referer header on authenticated request'
      });
    }
    return next();
  }

  try {
    const originUrl = new URL(origin);
    const originBase = `${originUrl.protocol}//${originUrl.host}`;

    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return allowedUrl.host === originUrl.host;
      } catch {
        return false;
      }
    });

    if (!isAllowed) {
      console.warn(`[CSRF] Blocked request from untrusted origin: ${originBase}`);
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Request origin is not permitted'
      });
    }
  } catch (err) {
    return res.status(403).json({
      success: false,
      error: 'Forbidden: Malformed Origin/Referer header'
    });
  }

  next();
}

module.exports = csrfProtection;

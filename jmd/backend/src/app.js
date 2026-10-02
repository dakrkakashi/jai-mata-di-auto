/**
 * Express Application Setup for Jai Mata Di Auto Backend
 * Pure API server: NO express.static of project roots.
 * Serves only /uploads via dedicated secure handler with nosniff.
 */

const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const fs = require('fs');
const zlib = require('zlib');

const {
  PORT,
  IS_PROD,
  ALLOWED_ORIGINS,
  TRUST_PROXY,
  UPLOADS_DIR
} = require('./config');

const csrfProtection = require('./middleware/csrf');
const errorHandler = require('./middleware/errorHandler');

// Route imports
const healthRoutes = require('./routes/health');
const authRoutes = require('./routes/auth');
const publicRoutes = require('./routes/public');
const leadsRoutes = require('./routes/leads');
const sparePartsRoutes = require('./routes/spareParts');
const contentRoutes = require('./routes/content');
const mediaRoutes = require('./routes/media');
const settingsRoutes = require('./routes/settings');
const statsRoutes = require('./routes/stats');
const emailRoutes = require('./routes/email');

const app = express();

// Trust proxy config
app.set('trust proxy', TRUST_PROXY);

// ── Security Headers (Helmet Equivalents) ───────────────────
app.use((req, res, next) => {
  res.removeHeader('X-Powered-By');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '0');
  if (IS_PROD) {
    res.setHeader('Strict-Transport-Security', 'max-age=15552000; includeSubDomains');
  }
  next();
});

// ── CORS Middleware ─────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    const isAllowed = ALLOWED_ORIGINS.some(allowed => {
      try {
        const allowedHost = new URL(allowed).host;
        const originHost = new URL(origin).host;
        return allowedHost === originHost;
      } catch {
        return false;
      }
    });

    if (isAllowed) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-admin-token, x-requested-with');
    }
  }

  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// ── Body & Cookie Parsers ───────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ── CSRF Protection ─────────────────────────────────────────
app.use(csrfProtection);

// ── Compression Middleware (Native zlib) ────────────────────
app.use((req, res, next) => {
  const acceptEncoding = req.headers['accept-encoding'] || '';
  if (!acceptEncoding.includes('gzip') || req.path.startsWith('/uploads')) {
    return next();
  }

  const originalSend = res.send;
  res.send = function (body) {
    if (typeof body === 'string' || Buffer.isBuffer(body)) {
      if (Buffer.byteLength(body) > 1024) {
        zlib.gzip(body, (err, zipped) => {
          if (!err) {
            res.setHeader('Content-Encoding', 'gzip');
            res.setHeader('Vary', 'Accept-Encoding');
            return originalSend.call(this, zipped);
          }
          return originalSend.call(this, body);
        });
        return this;
      }
    }
    return originalSend.call(this, body);
  };
  next();
});

// ── Dedicated Safe Static Handler for /uploads ──────────────
// Serves ONLY files from UPLOADS_DIR with verified Content-Type and nosniff
const MIME_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml'
};

app.use('/uploads', (req, res, next) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const safePath = path.normalize(req.path).replace(/^(\.\.[\/\\])+/, '');
  const filePath = path.join(UPLOADS_DIR, safePath);

  if (!filePath.startsWith(UPLOADS_DIR)) {
    return res.status(404).json({ success: false, error: 'Not found' });
  }

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    return res.status(404).json({ success: false, error: 'File not found' });
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext];
  if (!contentType) {
    return res.status(403).json({ success: false, error: 'File type not permitted' });
  }

  res.setHeader('Content-Type', contentType);
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Cache-Control', 'public, max-age=86400');
  fs.createReadStream(filePath).pipe(res);
});

// ── API Routes Mount ────────────────────────────────────────
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', publicRoutes);
app.use('/api', leadsRoutes);
app.use('/api', sparePartsRoutes);
app.use('/api', contentRoutes);
app.use('/api', mediaRoutes);
app.use('/api', settingsRoutes);
app.use('/api', statsRoutes);
app.use('/api', emailRoutes);

// ── 404 Fallback for All Other Routes ───────────────────────
// Absolute API isolation: returns 404 JSON for any unmapped route
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: `Cannot ${req.method} ${req.baseUrl || req.originalUrl}`
  });
});

// ── Global Error Handler ────────────────────────────────────
app.use(errorHandler);

module.exports = app;

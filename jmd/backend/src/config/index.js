/**
 * Backend Configuration Module
 * Loads environment variables, validates production requirements, and exports runtime constants.
 */

const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const NODE_ENV = process.env.NODE_ENV || 'development';
const IS_PROD = NODE_ENV === 'production';

// Production safety checks
if (IS_PROD) {
  if (!process.env.JWT_SECRET) {
    console.error('FATAL: JWT_SECRET environment variable is missing in production.');
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD) {
    console.error('FATAL: ADMIN_PASSWORD environment variable is missing in production.');
    process.exit(1);
  }
}

// Secret fallback handling
const JWT_SECRET = process.env.JWT_SECRET || (() => {
  console.warn('⚠️ WARNING: Using ephemeral random JWT secret in development. Set JWT_SECRET in .env for persistent sessions.');
  return crypto.randomBytes(32).toString('hex');
})();

const PORT = parseInt(process.env.PORT, 10) || 3000;

// Frontend origins for CORS
const defaultOrigins = ['http://localhost:5173', 'http://localhost:3000', 'http://127.0.0.1:5173', 'http://127.0.0.1:3000'];
const configuredOrigins = process.env.FRONTEND_ORIGIN
  ? process.env.FRONTEND_ORIGIN.split(',').map(o => o.trim()).filter(Boolean)
  : [];
const ALLOWED_ORIGINS = configuredOrigins.length > 0 ? configuredOrigins : defaultOrigins;

// Cookie settings
const COOKIE_NAME = 'jmd_admin';
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || undefined;
const COOKIE_SECURE = process.env.COOKIE_SECURE === 'true' || IS_PROD;
const COOKIE_SAMESITE = process.env.COOKIE_SAMESITE || 'lax';

// Reverse proxy trust
const TRUST_PROXY = process.env.TRUST_PROXY || 1;

// Directory Paths
const DATA_DIR = path.resolve(__dirname, '../../data');
const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

// Mail / SMTP settings
const GMAIL_USER = process.env.GMAIL_USER || process.env.SMTP_EMAIL || '';
const GMAIL_PASS = process.env.GMAIL_PASS || process.env.SMTP_PASSWORD || '';
const SITE_URL = process.env.SITE_URL || `http://localhost:${PORT}`;

module.exports = {
  NODE_ENV,
  IS_PROD,
  PORT,
  JWT_SECRET,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || '',
  ALLOWED_ORIGINS,
  COOKIE_NAME,
  COOKIE_DOMAIN,
  COOKIE_SECURE,
  COOKIE_SAMESITE,
  TRUST_PROXY,
  DATA_DIR,
  UPLOADS_DIR,
  GMAIL_USER,
  GMAIL_PASS,
  SITE_URL
};

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { readJSON, writeJSON, logActivity } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

/**
 * Single source of truth: CSS variable allow-list for theme customization.
 * Custom CSS injection has been completely retired.
 */
const ALLOWED_CSS_VARS = [
  '--color-primary',
  '--color-primary-dark',
  '--color-accent',
  '--color-accent-dark',
  '--color-bg',
  '--color-surface',
  '--color-text',
  '--color-muted',
  '--green',
  '--green-dark',
  '--green-light',
  '--green-glow',
  '--cyan',
  '--cyan-glow',
  '--amber',
  '--bg',
  '--bg-soft',
  '--bg-alt',
  '--white',
  '--dark',
  '--mid',
  '--muted',
  '--border',
  '--border-hover'
];

const ALLOWED_CSS_VARS_SET = new Set(ALLOWED_CSS_VARS);

// Hex color validation (#RGB or #RRGGBB)
const HEX_COLOR_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

// Allow-list of all accepted site settings keys (rejects unknown keys)
const ALLOWED_SETTINGS_KEYS = new Set([
  'siteName',
  'siteTitle',
  'tagline',
  'description',
  'phone',
  'whatsapp',
  'waNumber2',
  'email',
  'address',
  'hours',
  'dealerHours',
  'openingHours',
  'instagram',
  'facebook',
  'youtube',
  'twitter',
  'linkedin',
  'googleMapsUrl',
  'websiteUrl',
  'gaId',
  'fbPixelId',
  'headerCode',
  'footerCode',
  'robotsTxt',
  'maintenanceMode',
  'newPassword',
  'logo',
  'favicon',
  'priceNote'
]);

// Validation helpers
// Indian mobile: 10 digits starting with 6-9, optionally prefixed with +91, 91, or 0
const INDIAN_PHONE_REGEX = /^(?:\+91[\-\s]?|91[\-\s]?|0)?[6-9]\d{9}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_FIELDS = new Set(['instagram', 'facebook', 'youtube', 'twitter', 'linkedin', 'googleMapsUrl', 'websiteUrl']);
const PHONE_FIELDS = new Set(['phone', 'whatsapp', 'waNumber2']);
const HOURS_FIELDS = new Set(['hours', 'dealerHours', 'openingHours']);

// GET /api/admin/settings
router.get('/admin/settings', adminAuth, (req, res) => {
  try {
    const settings = readJSON('settings.json', {});
    const safeSettings = { ...settings };
    delete safeSettings.adminPassword;
    delete safeSettings.adminPasswordRaw;
    delete safeSettings.customCss; // Never expose customCss
    res.json(safeSettings);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read settings' });
  }
});

// POST /api/admin/settings
router.post('/admin/settings', adminAuth, (req, res) => {
  try {
    const updates = req.body;
    if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
      return res.status(400).json({ success: false, error: 'Invalid settings payload: expected an object' });
    }

    // Explicitly reject if customCss is present
    if ('customCss' in updates) {
      return res.status(400).json({ success: false, error: 'customCss has been retired and is not allowed' });
    }

    // 1. Reject unknown keys
    const receivedKeys = Object.keys(updates);
    for (const key of receivedKeys) {
      if (!ALLOWED_SETTINGS_KEYS.has(key)) {
        return res.status(400).json({
          success: false,
          error: `Unknown or unallowed settings key: "${key}"`
        });
      }
    }

    // 2. Validate phone and WhatsApp numbers (Indian format)
    for (const field of PHONE_FIELDS) {
      if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
        const val = String(updates[field]).trim();
        if (!INDIAN_PHONE_REGEX.test(val)) {
          return res.status(400).json({
            success: false,
            error: `Invalid phone format for "${field}". Must be a valid 10-digit Indian phone number (e.g. +91-9890202091 or 9890202091).`
          });
        }
      }
    }

    // 3. Validate email
    if (updates.email !== undefined && updates.email !== null && updates.email !== '') {
      const val = String(updates.email).trim();
      if (!EMAIL_REGEX.test(val)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid email address format'
        });
      }
    }

    // 4. Validate URLs (https only)
    for (const field of URL_FIELDS) {
      if (updates[field] !== undefined && updates[field] !== null && updates[field] !== '') {
        const val = String(updates[field]).trim();
        if (!val.startsWith('https://')) {
          return res.status(400).json({
            success: false,
            error: `Invalid URL for "${field}". Must start with https://`
          });
        }
        try {
          const parsed = new URL(val);
          if (parsed.protocol !== 'https:') {
            return res.status(400).json({
              success: false,
              error: `Invalid URL protocol for "${field}": must use https://`
            });
          }
        } catch {
          return res.status(400).json({
            success: false,
            error: `Malformed URL for "${field}"`
          });
        }
      }
    }

    // 5. Validate opening hours length (max 200 chars)
    for (const field of HOURS_FIELDS) {
      if (updates[field] !== undefined && updates[field] !== null) {
        const val = String(updates[field]);
        if (val.length > 200) {
          return res.status(400).json({
            success: false,
            error: `Opening hours for "${field}" must not exceed 200 characters (received ${val.length})`
          });
        }
      }
    }

    // 6. Password validation & hashing
    const settings = readJSON('settings.json', {});
    delete settings.customCss; // Purge legacy customCss if present

    if (updates.newPassword !== undefined && updates.newPassword !== null && updates.newPassword !== '') {
      const pw = String(updates.newPassword).trim();
      if (pw.length < 6) {
        return res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      }
      settings.adminPassword = bcrypt.hashSync(pw, 10);
      delete updates.newPassword;
    }

    // 7. Maintenance mode type enforcement
    if (updates.maintenanceMode !== undefined) {
      updates.maintenanceMode = Boolean(updates.maintenanceMode);
    }

    Object.assign(settings, updates);
    delete settings.newPassword;
    delete settings.customCss;

    writeJSON('settings.json', settings);
    logActivity('Updated site settings');

    const safeSettings = { ...settings };
    delete safeSettings.adminPassword;
    delete safeSettings.adminPasswordRaw;
    delete safeSettings.customCss;

    res.json({ success: true, settings: safeSettings });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save settings' });
  }
});

// POST /api/admin/save-theme
router.post('/admin/save-theme', adminAuth, (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return res.status(400).json({ success: false, error: 'Invalid payload: expected an object' });
    }

    // Explicitly reject customCss
    if ('customCss' in body) {
      return res.status(400).json({ success: false, error: 'customCss has been retired and is not allowed' });
    }

    // Support either { variables: { '--color-...': '#...' } } or direct { '--color-...': '#...' }
    let varsToValidate = body.variables ? body.variables : body;
    if (body.variables) {
      const topKeys = Object.keys(body);
      if (topKeys.length > 1) {
        return res.status(400).json({ success: false, error: 'Unknown top-level keys in theme payload' });
      }
    }

    if (!varsToValidate || typeof varsToValidate !== 'object' || Array.isArray(varsToValidate)) {
      return res.status(400).json({ success: false, error: 'Invalid theme variables: expected an object' });
    }

    const varKeys = Object.keys(varsToValidate);
    if (varKeys.length === 0) {
      return res.status(400).json({ success: false, error: 'No theme variables provided' });
    }

    const validatedTheme = {};
    for (const key of varKeys) {
      if (!ALLOWED_CSS_VARS_SET.has(key)) {
        return res.status(400).json({
          success: false,
          error: `Unknown theme variable "${key}". Must be an allowed CSS variable name from the allow-list.`
        });
      }
      const val = varsToValidate[key];
      if (typeof val !== 'string' || !HEX_COLOR_REGEX.test(val.trim())) {
        return res.status(400).json({
          success: false,
          error: `Invalid color value for "${key}": "${val}". Must be a valid hex color (#RGB or #RRGGBB).`
        });
      }
      validatedTheme[key] = val.trim();
    }

    const settings = readJSON('settings.json', {});
    delete settings.customCss; // Ensure customCss is stripped
    settings.theme = settings.theme || {};
    Object.assign(settings.theme, validatedTheme);

    writeJSON('settings.json', settings);
    logActivity('Updated theme settings');

    res.json({ success: true, theme: settings.theme });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save theme' });
  }
});

// GET /api/admin/todos
router.get('/admin/todos', adminAuth, (req, res) => {
  try {
    const todos = readJSON('todos.json', []);
    res.json(todos);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read todos' });
  }
});

// POST /api/admin/todos
router.post('/admin/todos', adminAuth, (req, res) => {
  try {
    const todos = req.body;
    if (!Array.isArray(todos)) {
      return res.status(400).json({ success: false, error: 'Expected an array of todos' });
    }
    writeJSON('todos.json', todos);
    res.json({ success: true, todos });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save todos' });
  }
});

// GET /api/admin/backup
router.get('/admin/backup', adminAuth, (req, res) => {
  try {
    const files = ['settings.json', 'leads.json', 'content.json', 'todos.json', 'stats.json', 'activity.json', 'spare-parts.json'];
    const backup = {
      exportedAt: new Date().toISOString(),
      data: {}
    };

    files.forEach(f => {
      backup.data[f] = readJSON(f, null);
    });

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="jmd-backup-${Date.now()}.json"`);
    res.send(JSON.stringify(backup, null, 2));
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create backup dump' });
  }
});

module.exports = router;
module.exports.ALLOWED_CSS_VARS = ALLOWED_CSS_VARS;
module.exports.ALLOWED_SETTINGS_KEYS = ALLOWED_SETTINGS_KEYS;

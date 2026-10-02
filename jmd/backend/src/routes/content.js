const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, logActivity } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

// GET /api/admin/content
router.get('/admin/content', adminAuth, (req, res) => {
  try {
    const content = readJSON('content.json', {});
    res.json(content);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read content' });
  }
});

// POST /api/admin/content
router.post('/admin/content', adminAuth, (req, res) => {
  try {
    const { key, value } = req.body || {};
    if (!key || typeof key !== 'string') {
      return res.status(400).json({ success: false, error: 'Missing or invalid content key' });
    }

    const content = readJSON('content.json', {});
    content[key] = value;
    writeJSON('content.json', content);

    logActivity('Updated content field', { key });
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update content' });
  }
});

// GET /api/admin/pages
// Returns a read-only list of public static page names
router.get('/admin/pages', adminAuth, (req, res) => {
  try {
    const staticPages = [
      'index.html',
      'models.html',
      'nexus-st.html',
      'magnus-ex.html',
      'magnus-grand.html',
      'magnus-gmax.html',
      'magnus-neo.html',
      'reo-80.html',
      'reo-li.html',
      'spare-parts.html',
      'contact.html',
      'dealer.html',
      'test-ride.html',
      'savings.html'
    ];
    res.json(staticPages);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list pages' });
  }
});

module.exports = router;

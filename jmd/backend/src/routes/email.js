const express = require('express');
const router = express.Router();
const { testSMTP, sendCustomEmail } = require('../services/mailer');
const { logActivity } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

router.use(['/admin/test-smtp', '/admin/send-email'], adminAuth);

// POST /api/admin/test-smtp
router.post('/admin/test-smtp', async (req, res) => {
  try {
    await testSMTP();
    logActivity('Tested SMTP configuration - Success');
    res.json({ success: true, message: 'SMTP configuration verified successfully' });
  } catch (err) {
    logActivity('Tested SMTP configuration - Failed', { error: err.message });
    res.status(500).json({ success: false, error: err.message || 'SMTP connection failed' });
  }
});

// POST /api/admin/send-email
router.post('/admin/send-email', async (req, res) => {
  try {
    const { to, subject, body, html } = req.body || {};
    if (!to || !subject || (!body && !html)) {
      return res.status(400).json({ success: false, error: 'Recipient, subject, and content are required' });
    }

    await sendCustomEmail({ to, subject, body, html });
    logActivity('Sent manual email from admin', { to, subject });
    res.json({ success: true, message: 'Email sent successfully' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to send email' });
  }
});

module.exports = router;

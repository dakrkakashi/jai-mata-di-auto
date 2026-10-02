const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, logActivity, querySpareParts } = require('../services/storage');
const { sendLeadAlert } = require('../services/mailer');
const { leadLimiter } = require('../middleware/rateLimit');
const { validateLead } = require('../middleware/validate');

/**
 * GET /api/public/spare-parts
 * Public e-commerce parts catalog endpoint with search, category filtering, and pagination.
 */
router.get('/public/spare-parts', (req, res) => {
  try {
    const { q, search, category, model, page, limit, sort } = req.query;
    const result = querySpareParts({ q: q || search, category, model, page, limit, sort });
    res.json({
      success: true,
      ...result
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to load spare parts catalog' });
  }
});

/**
 * POST /api/submit-lead
 * Public lead capture endpoint with rate limiting, server-side validation, honeypot, and email alerts.
 */
router.post('/submit-lead', leadLimiter, validateLead, async (req, res) => {
  try {
    const lead = req.validatedLead;
    lead.id = Date.now();

    const leads = readJSON('leads.json', []);
    leads.unshift(lead);
    writeJSON('leads.json', leads);

    logActivity('New lead submitted', { name: lead.name, model: lead.model });

    // Send asynchronous email notification (does not block response)
    sendLeadAlert(lead).catch(e => console.warn('Lead alert email error:', e.message));

    return res.status(200).json({
      success: true,
      message: 'Thank you! Your enquiry has been received. Our team will contact you shortly.'
    });
  } catch (err) {
    console.error('Lead submission error:', err);
    return res.status(500).json({
      success: false,
      error: 'An internal error occurred while processing your request. Please call us directly.'
    });
  }
});

/**
 * GET /api/content
 * Public content endpoint with secret sanitization and path traversal prevention.
 */
router.get('/content', (req, res) => {
  try {
    const { page } = req.query;
    if (page) {
      if (!/^[a-zA-Z0-9_\-]+$/.test(page)) {
        return res.status(400).json({ success: false, error: 'Invalid page identifier' });
      }
    }

    const allContent = readJSON('content.json', {});
    const rawSettings = readJSON('settings.json', {});

    // Strip secrets and sensitive admin configurations
    const sanitizedSettings = {
      siteTitle: rawSettings.siteTitle || 'Jai Mata Di Auto',
      tagline: rawSettings.tagline || '',
      phone: rawSettings.phone || '+91-9890202091',
      whatsapp: rawSettings.whatsapp || '+91-9890202091',
      email: rawSettings.email || '',
      address: rawSettings.address || 'Loni Kh., Ahilyanagar, Maharashtra',
      googleMapsUrl: rawSettings.googleMapsUrl || '',
      hours: rawSettings.hours || '',
      social: rawSettings.social || {},
      priceNote: rawSettings.priceNote || ''
    };

    if (page) {
      return res.json({
        success: true,
        page,
        content: allContent[page] || {},
        settings: sanitizedSettings
      });
    }

    return res.json({
      success: true,
      content: allContent,
      settings: sanitizedSettings
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: 'Failed to retrieve public content' });
  }
});

module.exports = router;

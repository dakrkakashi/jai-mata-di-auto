/**
 * Validation Middleware
 * Validates lead submissions, honeypot inputs, and CMS settings payloads.
 */

const ALLOWED_CONFIG_KEYS = new Set([
  'phone', 'whatsapp', 'email', 'address', 'city', 'businessName', 'timing',
  'hero_headline', 'hero_subheadline', 'banner_text', 'banner_active',
  'offer_text', 'offer_active', 'primaryColor', 'accentColor',
  'meta_title', 'meta_desc', 'keywords'
]);

function validateLead(req, res, next) {
  const { name, phone, email, model, message, pincode, _hp, website, botcheck } = req.body || {};

  // Honeypot check
  if (_hp || website || botcheck) {
    console.warn(`[Spam Blocked] Honeypot triggered from IP: ${req.ip}`);
    return res.status(400).json({ success: false, error: 'Invalid submission detected' });
  }

  // Name check (2 to 100 characters)
  const trimmedName = String(name || '').trim();
  if (!trimmedName || trimmedName.length < 2 || trimmedName.length > 100) {
    return res.status(400).json({ success: false, error: 'Please enter a valid full name (2-100 characters).' });
  }

  // Indian phone number check (10 digits starting with 6-9)
  const cleanPhone = String(phone || '').replace(/[\s\-\+]/g, '').replace(/^91/, '');
  if (!/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 10-digit Indian mobile number.' });
  }

  // Email format check (optional)
  if (email && email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  // Message cap (max 1000 characters)
  if (message && String(message).length > 1000) {
    return res.status(400).json({ success: false, error: 'Message exceeds maximum length of 1000 characters.' });
  }

  // Pincode format (optional 6-digit number)
  if (pincode && pincode.trim() && !/^\d{6}$/.test(pincode.trim())) {
    return res.status(400).json({ success: false, error: 'Please enter a valid 6-digit postal pincode.' });
  }

  req.validatedLead = {
    name: trimmedName,
    phone: cleanPhone,
    email: (email || '').trim().toLowerCase(),
    model: String(model || 'General Enquiry').slice(0, 100).trim(),
    message: String(message || '').slice(0, 1000).trim(),
    pincode: (pincode || '').trim(),
    source: String(req.body.source || 'Website').slice(0, 50).trim(),
    time: new Date().toISOString()
  };

  next();
}

function validateCMSPayload(req, res, next) {
  const updates = req.body;
  if (!updates || typeof updates !== 'object' || Array.isArray(updates)) {
    return res.status(400).json({ success: false, error: 'Invalid payload format. Expected a JSON object.' });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(updates)) {
    if (ALLOWED_CONFIG_KEYS.has(key)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/<\s*\/\s*script\s*>/gi, '').slice(0, 500);
      } else if (typeof value === 'boolean') {
        sanitized[key] = value;
      }
    }
  }

  req.sanitizedCMS = sanitized;
  next();
}

module.exports = {
  validateLead,
  validateCMSPayload,
  ALLOWED_CONFIG_KEYS
};

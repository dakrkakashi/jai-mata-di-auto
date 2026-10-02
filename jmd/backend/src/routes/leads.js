const express = require('express');
const router = express.Router();
const { readJSON, writeJSON, logActivity } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

router.use(['/admin/leads', '/leads'], adminAuth);

// GET /api/admin/leads (and legacy alias /api/leads)
router.get(['/admin/leads', '/leads'], (req, res) => {
  try {
    const leads = readJSON('leads.json', []);
    res.json(leads);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch leads' });
  }
});

// POST /api/admin/leads/status (and alias /api/admin/leads/update)
router.post(['/admin/leads/status', '/admin/leads/update'], (req, res) => {
  try {
    const { id, status } = req.body || {};
    if (!id || !status) {
      return res.status(400).json({ success: false, error: 'Missing lead id or status' });
    }

    const leads = readJSON('leads.json', []);
    const lead = leads.find(l => String(l.id) === String(id));
    if (!lead) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    lead.status = status;
    lead.updatedAt = new Date().toISOString();
    writeJSON('leads.json', leads);

    logActivity('Updated lead status', { id, status });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update lead status' });
  }
});

// POST /api/admin/leads/delete
router.post('/admin/leads/delete', (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Missing lead id' });

    let leads = readJSON('leads.json', []);
    const initialLen = leads.length;
    leads = leads.filter(l => String(l.id) !== String(id));

    if (leads.length === initialLen) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    writeJSON('leads.json', leads);
    logActivity('Deleted lead', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete lead' });
  }
});

// POST /api/admin/leads/bulk
router.post('/admin/leads/bulk', (req, res) => {
  try {
    const { action, ids, status } = req.body || {};
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: 'Invalid or empty ids array' });
    }

    let leads = readJSON('leads.json', []);
    const idSet = new Set(ids.map(String));

    if (action === 'delete') {
      leads = leads.filter(l => !idSet.has(String(l.id)));
      writeJSON('leads.json', leads);
      logActivity('Bulk deleted leads', { count: ids.length });
      return res.json({ success: true, count: ids.length });
    }

    if (action === 'status') {
      if (!status) return res.status(400).json({ success: false, error: 'Missing status for bulk update' });
      leads.forEach(l => {
        if (idSet.has(String(l.id))) {
          l.status = status;
          l.updatedAt = new Date().toISOString();
        }
      });
      writeJSON('leads.json', leads);
      logActivity('Bulk updated lead status', { count: ids.length, status });
      return res.json({ success: true, count: ids.length });
    }

    return res.status(400).json({ success: false, error: 'Unknown bulk action' });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to perform bulk lead operation' });
  }
});

// GET /api/admin/leads/export
router.get('/admin/leads/export', (req, res) => {
  try {
    const leads = readJSON('leads.json', []);
    const headers = ['ID', 'Date', 'Name', 'Phone', 'Email', 'Model', 'Pincode', 'Source', 'Status', 'Message'];
    
    function sanitizeCSVCell(val) {
      if (val === null || val === undefined) return '""';
      let str = String(val);
      // Neutralize CSV formula injection: prefix with a single quote if string starts with =, +, -, @, \t, or \r
      if (/^[=\+\-@\t\r]/.test(str)) {
        str = "'" + str;
      }
      return `"${str.replace(/"/g, '""')}"`;
    }

    const rows = leads.map(l => [
      l.id,
      sanitizeCSVCell(new Date(l.time || l.id || Date.now()).toISOString()),
      sanitizeCSVCell(l.name),
      sanitizeCSVCell(l.phone),
      sanitizeCSVCell(l.email),
      sanitizeCSVCell(l.model),
      sanitizeCSVCell(l.pincode),
      sanitizeCSVCell(l.source),
      sanitizeCSVCell(l.status || 'New'),
      sanitizeCSVCell(l.message)
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="jmd-leads-${Date.now()}.csv"`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to export leads' });
  }
});

module.exports = router;

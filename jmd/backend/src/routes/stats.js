const express = require('express');
const router = express.Router();
const { readJSON } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

router.use(['/admin/stats', '/admin/analytics'], adminAuth);

// GET /api/admin/analytics
router.get('/admin/analytics', (req, res) => {
  try {
    const stats = readJSON('stats.json', {});
    const leads = readJSON('leads.json', []);

    const now = new Date();
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      last7Days.push(d.toISOString().split('T')[0]);
    }

    const dailyVisits = {};
    const dailyLeads = {};
    last7Days.forEach(day => {
      dailyVisits[day] = (stats.daily && stats.daily[day]) || 0;
      dailyLeads[day] = leads.filter(l => (l.time || '').startsWith(day)).length;
    });

    res.json({
      success: true,
      totalVisits: stats.totalVisits || 0,
      totalLeads: leads.length,
      last7Days,
      dailyVisits,
      dailyLeads,
      topPages: stats.pages || {},
      devices: stats.devices || { desktop: 0, mobile: 0, tablet: 0 }
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to compile analytics' });
  }
});

// GET /api/admin/stats
router.get('/admin/stats', (req, res) => {
  try {
    const stats = readJSON('stats.json', {});
    res.json(stats);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read stats' });
  }
});

module.exports = router;

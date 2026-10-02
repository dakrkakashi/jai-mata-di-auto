const express = require('express');
const router = express.Router();
const {
  readJSON,
  getSpareParts,
  updateSparePart,
  saveSparePartFull,
  clearSparePartFlag,
  deleteSparePart,
  addSparePart,
  logActivity
} = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

router.use('/admin/spare-parts', adminAuth);

// GET /api/admin/price-list-meta
router.get('/admin/price-list-meta', adminAuth, (req, res) => {
  try {
    const meta = readJSON('price-list-meta.json', null);
    if (!meta) {
      return res.status(404).json({ success: false, error: 'Price list metadata not found' });
    }
    res.json({ success: true, meta });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read price list metadata' });
  }
});

// GET /api/admin/spare-parts
router.get('/admin/spare-parts', (req, res) => {
  try {
    const parts = getSpareParts();
    const { flagged, hold } = req.query;
    let result = parts;
    if (flagged === 'true') {
      result = result.filter(p => p.needsVerification || p.flagged || p.conflict);
    } else if (hold === 'true') {
      result = result.filter(p => p.needsVerification);
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to read spare parts catalog' });
  }
});

// POST /api/admin/spare-parts/clear-flag
router.post('/admin/spare-parts/clear-flag', (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Missing part id' });

    const updated = clearSparePartFlag(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Spare part not found' });
    }

    logActivity('Cleared spare part verification flag', { id, code: updated.code });
    res.json({ success: true, part: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear verification flag' });
  }
});

// POST /api/admin/spare-parts/:id/clear-flag
router.post('/admin/spare-parts/:id/clear-flag', (req, res) => {
  try {
    const id = req.params.id;
    const updated = clearSparePartFlag(id);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Spare part not found' });
    }

    logActivity('Cleared spare part verification flag', { id, code: updated.code });
    res.json({ success: true, part: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to clear verification flag' });
  }
});

// POST /api/admin/spare-parts/update
router.post('/admin/spare-parts/update', (req, res) => {
  try {
    const { id, field, value } = req.body || {};
    if (!id || !field) {
      return res.status(400).json({ success: false, error: 'Missing part id or field' });
    }

    const updated = updateSparePart(id, field, value);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Spare part not found' });
    }

    logActivity('Updated spare part field', { id, field, value });
    res.json({ success: true, part: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to update spare part' });
  }
});

// POST /api/admin/spare-parts/save
router.post('/admin/spare-parts/save', (req, res) => {
  try {
    const { id, updates } = req.body || {};
    if (!id || !updates) {
      return res.status(400).json({ success: false, error: 'Missing part id or updates payload' });
    }

    const updated = saveSparePartFull(id, updates);
    if (!updated) {
      return res.status(404).json({ success: false, error: 'Spare part not found' });
    }

    logActivity('Saved spare part details', { id, name: updated.name });
    res.json({ success: true, part: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to save spare part' });
  }
});

// POST /api/admin/spare-parts/delete
router.post('/admin/spare-parts/delete', (req, res) => {
  try {
    const { id } = req.body || {};
    if (!id) return res.status(400).json({ success: false, error: 'Missing part id' });

    const deleted = deleteSparePart(id);
    if (!deleted) {
      return res.status(404).json({ success: false, error: 'Spare part not found' });
    }

    logActivity('Deleted spare part', { id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete spare part' });
  }
});

// POST /api/admin/spare-parts/add
router.post('/admin/spare-parts/add', (req, res) => {
  try {
    const { name, code, category, model, price, stock, description, image } = req.body || {};
    if (!name || !code) {
      return res.status(400).json({ success: false, error: 'Part name and code are required' });
    }

    const newPart = addSparePart({
      name,
      code,
      category,
      model,
      price,
      stock,
      description,
      image
    });

    logActivity('Added new spare part', { id: newPart.id, name: newPart.name, code: newPart.code });
    res.json({ success: true, part: newPart });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to add spare part' });
  }
});

module.exports = router;

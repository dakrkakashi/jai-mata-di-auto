const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { UPLOADS_DIR } = require('../config');
const { logActivity } = require('../services/storage');
const adminAuth = require('../middleware/adminAuth');

router.use(['/admin/media', '/admin/images', '/admin/storage-stats'], adminAuth);

function safeResolve(subpath = '') {
  const safe = path.normalize(subpath).replace(/^(\.\.[\/\\])+/, '');
  const resolved = path.join(UPLOADS_DIR, safe);
  if (!resolved.startsWith(UPLOADS_DIR)) {
    throw new Error('Path traversal attempt detected');
  }
  return resolved;
}

// GET /api/admin/media
router.get('/admin/media', (req, res) => {
  try {
    const folder = req.query.folder || '';
    const targetDir = safeResolve(folder);
    if (!fs.existsSync(targetDir)) {
      return res.status(404).json({ success: false, error: 'Directory not found' });
    }

    const entries = fs.readdirSync(targetDir, { withFileTypes: true });
    const items = entries.map(e => {
      const p = path.join(targetDir, e.name);
      const stat = fs.statSync(p);
      return {
        name: e.name,
        isDir: e.isDirectory(),
        size: stat.size,
        modified: stat.mtime.toISOString(),
        url: e.isDirectory() ? null : `/uploads/${folder ? folder + '/' : ''}${e.name}`
      };
    });

    res.json({ success: true, folder, items });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message || 'Failed to list media' });
  }
});

// POST /api/admin/media/upload
router.post('/admin/media/upload', (req, res) => {
  try {
    const { folder, filename, base64 } = req.body || {};
    if (!filename || !base64) {
      return res.status(400).json({ success: false, error: 'Missing filename or base64 data' });
    }

    const safeFilename = path.basename(filename).replace(/[^a-zA-Z0-9_\-\.]/g, '_');
    const targetDir = safeResolve(folder || '');
    fs.mkdirSync(targetDir, { recursive: true });

    const targetFile = path.join(targetDir, safeFilename);
    const data = base64.replace(/^data:[^;]+;base64,/, '');
    fs.writeFileSync(targetFile, Buffer.from(data, 'base64'));

    logActivity('Uploaded media file', { filename: safeFilename });
    res.json({
      success: true,
      url: `/uploads/${folder ? folder + '/' : ''}${safeFilename}`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to upload media file' });
  }
});

// POST /api/admin/media/delete
router.post('/admin/media/delete', (req, res) => {
  try {
    const { filepath } = req.body || {};
    if (!filepath) return res.status(400).json({ success: false, error: 'Missing filepath' });

    const target = safeResolve(filepath);
    if (!fs.existsSync(target)) {
      return res.status(404).json({ success: false, error: 'File not found' });
    }

    fs.rmSync(target, { recursive: true, force: true });
    logActivity('Deleted media item', { filepath });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to delete media item' });
  }
});

// POST /api/admin/media/mkdir
router.post('/admin/media/mkdir', (req, res) => {
  try {
    const { folder, name } = req.body || {};
    if (!name) return res.status(400).json({ success: false, error: 'Missing directory name' });

    const safeName = path.basename(name).replace(/[^a-zA-Z0-9_\-]/g, '_');
    const target = safeResolve(path.join(folder || '', safeName));
    fs.mkdirSync(target, { recursive: true });

    logActivity('Created media directory', { dir: safeName });
    res.json({ success: true, folder: safeName });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to create directory' });
  }
});

// POST /api/admin/media/rename
router.post('/admin/media/rename', (req, res) => {
  try {
    const { oldPath, newPath } = req.body || {};
    if (!oldPath || !newPath) return res.status(400).json({ success: false, error: 'Missing path arguments' });

    const src = safeResolve(oldPath);
    const dest = safeResolve(newPath);

    if (!fs.existsSync(src)) return res.status(404).json({ success: false, error: 'Source file not found' });
    if (fs.existsSync(dest)) return res.status(409).json({ success: false, error: 'Target file already exists' });

    fs.renameSync(src, dest);
    logActivity('Renamed media file', { oldPath, newPath });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to rename media item' });
  }
});

// GET /api/admin/images (alias)
router.get('/admin/images', (req, res) => {
  try {
    const files = fs.readdirSync(UPLOADS_DIR)
      .filter(f => /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(f))
      .map(f => ({ name: f, url: `/uploads/${f}` }));
    res.json(files);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to list images' });
  }
});

// GET /api/admin/storage-stats
router.get('/admin/storage-stats', (req, res) => {
  try {
    function getDirSize(dir) {
      let size = 0;
      if (!fs.existsSync(dir)) return 0;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const e of entries) {
        const p = path.join(dir, e.name);
        if (e.isDirectory()) {
          size += getDirSize(p);
        } else {
          size += fs.statSync(p).size;
        }
      }
      return size;
    }

    const uploadsSize = getDirSize(UPLOADS_DIR);
    res.json({
      success: true,
      uploadsSizeBytes: uploadsSize,
      uploadsSizeMB: (uploadsSize / (1024 * 1024)).toFixed(2)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to calculate storage stats' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const { NODE_ENV } = require('../config');

router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env: NODE_ENV
  });
});

module.exports = router;

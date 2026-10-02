/**
 * Jai Mata Di Auto — Backend API Server
 * Modular, secure Express API server.
 */

const app = require('./src/app');
const { PORT, NODE_ENV, ADMIN_PASSWORD } = require('./src/config');
const { readJSON, writeJSON } = require('./src/services/storage');
const bcrypt = require('bcryptjs');

// Startup initialization: verify admin password hash
try {
  const settings = readJSON('settings.json', {});
  if (!settings.adminPassword && ADMIN_PASSWORD) {
    settings.adminPassword = bcrypt.hashSync(ADMIN_PASSWORD, 10);
    writeJSON('settings.json', settings);
    console.log('✅ Admin password hash initialized from environment');
  }
} catch (e) {
  console.warn('Startup settings warning:', e.message);
}

const server = app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 JMD Auto API Server running on port ${PORT}`);
  console.log(`   Environment: ${NODE_ENV}`);
  console.log(`   Health Check: http://localhost:${PORT}/api/health`);
  console.log(`   Public Spare Parts: http://localhost:${PORT}/api/public/spare-parts`);
  console.log(`=================================================`);
});

module.exports = server;

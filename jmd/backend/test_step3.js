/**
 * Automated Verification Test Suite for Step 3: Backend Extraction
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

// Set test environment
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_step3_1234567890123456';
process.env.ADMIN_PASSWORD = 'test_password_123';
process.env.FRONTEND_ORIGIN = 'http://localhost:5173,http://localhost:3000';

const app = require('./src/app');
const { writeJSON, readJSON } = require('./src/services/storage');

const TEST_PORT = 3131;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      ...options
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch {}
        resolve({
          status: res.statusCode,
          headers: res.headers,
          body: data,
          json
        });
      });
    });
    req.on('error', reject);
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log('Starting Step 3 Backend Verification Suite...\n');

  // Save backup of settings and leads to restore afterwards
  const originalSettings = readJSON('settings.json', {});
  const originalLeads = readJSON('leads.json', []);

  // Set test admin password hash
  const testSettings = { ...originalSettings, adminPassword: bcrypt.hashSync('test_password_123', 10) };
  writeJSON('settings.json', testSettings);

  const server = app.listen(TEST_PORT);
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Health check
    const rHealth = await request({ path: '/api/health', method: 'GET' });
    assert(rHealth.status === 200 && rHealth.json && rHealth.json.status === 'ok', 'GET /api/health returns 200 with status: ok');

    // 2. Public spare parts catalog
    const rParts = await request({ path: '/api/public/spare-parts', method: 'GET' });
    assert(rParts.status === 200 && rParts.json && rParts.json.success === true && rParts.json.total > 2000,
      `GET /api/public/spare-parts returns 200 with total ${rParts.json?.total} parts`);

    // 3. Public spare parts search & filtering
    const rPartsSearch = await request({ path: '/api/public/spare-parts?q=lamp&category=Lighting&page=1&limit=5', method: 'GET' });
    assert(rPartsSearch.status === 200 && rPartsSearch.json.data.length <= 5 && rPartsSearch.json.data.length > 0,
      `GET /api/public/spare-parts pagination & search returns ${rPartsSearch.json?.data?.length} parts`);

    // 4. Public lead submission
    const rLead = await request({
      path: '/api/submit-lead',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Step3 Test User',
      phone: '9876543210',
      model: 'Nexus',
      message: 'Test enquiry'
    });
    assert(rLead.status === 200 && rLead.json && rLead.json.success === true, 'POST /api/submit-lead accepts valid lead');

    // 5. Honeypot check
    const rHoneypot = await request({
      path: '/api/submit-lead',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      name: 'Bot User',
      phone: '9876543210',
      _hp: 'spam value'
    });
    assert(rHoneypot.status === 400, 'POST /api/submit-lead rejects honeypot trigger with 400');

    // 6. Public content endpoint
    const rContent = await request({ path: '/api/content', method: 'GET' });
    assert(rContent.status === 200 && rContent.json.settings && !rContent.json.settings.adminPassword,
      'GET /api/content returns sanitized public settings without password hashes');

    // 7. Protected route without auth
    const rLeadsUnauth = await request({ path: '/api/admin/leads', method: 'GET' });
    assert(rLeadsUnauth.status === 401, 'GET /api/admin/leads rejects unauthenticated request with 401');

    // 8. Admin login sets httpOnly cookie and omits token from JSON body
    const rLogin = await request({
      path: '/api/admin/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      password: 'test_password_123'
    });
    assert(rLogin.status === 200 && rLogin.json.success === true, 'POST /api/admin/login succeeds with valid password');
    assert(rLogin.json.token === undefined, 'POST /api/admin/login does NOT return token in JSON response');
    const setCookie = rLogin.headers['set-cookie'];
    assert(setCookie && setCookie.some(c => c.includes('jmd_admin=') && c.includes('HttpOnly')),
      'POST /api/admin/login sets httpOnly jmd_admin cookie');

    // Extract cookie string for authenticated requests
    const cookieHeader = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';

    // 9. Authenticated check-auth via cookie
    const rCheckAuth = await request({
      path: '/api/admin/check-auth',
      method: 'GET',
      headers: { Cookie: cookieHeader }
    });
    assert(rCheckAuth.status === 200 && rCheckAuth.json.authenticated === true, 'GET /api/admin/check-auth verifies cookie session');

    // 10. Authenticated spare parts CRUD via cookie
    const rAdminParts = await request({
      path: '/api/admin/spare-parts',
      method: 'GET',
      headers: { Cookie: cookieHeader }
    });
    assert(rAdminParts.status === 200 && Array.isArray(rAdminParts.json), 'GET /api/admin/spare-parts returns full catalog to admin');

    // 11. Dedicated static handler for /uploads with nosniff
    const rUpload = await request({ path: '/uploads/download.jpg', method: 'GET' });
    assert(rUpload.status === 200 && rUpload.headers['x-content-type-options'] === 'nosniff',
      'GET /uploads/download.jpg returns 200 with X-Content-Type-Options: nosniff');

    // 12. Path isolation: Root and project files return 404
    const rServerJs = await request({ path: '/server.js', method: 'GET' });
    assert(rServerJs.status === 404, 'GET /server.js returns 404 (source code hidden)');

    const rPackage = await request({ path: '/package.json', method: 'GET' });
    assert(rPackage.status === 404, 'GET /package.json returns 404');

    const rLeadsJson = await request({ path: '/data/leads.json', method: 'GET' });
    assert(rLeadsJson.status === 404, 'GET /data/leads.json returns 404 (database hidden)');

    // 13. CORS preflight verification
    const rCors = await request({
      path: '/api/health',
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'GET'
      }
    });
    assert(rCors.status === 204 && rCors.headers['access-control-allow-origin'] === 'http://localhost:5173' && rCors.headers['access-control-allow-credentials'] === 'true',
      'CORS preflight allows FRONTEND_ORIGIN with credentials: true');

    // 14. CSRF defense: Untrusted origin blocked on state-changing authenticated request
    const rCsrfBlocked = await request({
      path: '/api/admin/leads/status',
      method: 'POST',
      headers: {
        Cookie: cookieHeader,
        Origin: 'https://malicious-attacker.com',
        'Content-Type': 'application/json'
      }
    }, { id: 1, status: 'Contacted' });
    assert(rCsrfBlocked.status === 403, 'CSRF defense blocks state-changing request from untrusted origin with 403');

  } finally {
    // Restore settings and leads
    writeJSON('settings.json', originalSettings);
    writeJSON('leads.json', originalLeads);
    server.close();
  }

  console.log(`\nVerification finished with ${failed} failure(s).`);
  process.exit(failed === 0 ? 0 : 1);
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

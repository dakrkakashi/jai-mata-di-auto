/**
 * End-to-End Separation Smoke Test Suite
 * Validates backend isolation, frontend serving, and cross-tier integration
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const BACKEND_DIR = path.join(ROOT, 'jmd', 'backend');

let passedTests = 0;
let failedTests = 0;

function logPass(msg) {
  console.log(`\x1b[32m✅ PASS:\x1b[0m ${msg}`);
  passedTests++;
}

function logFail(msg, detail) {
  console.error(`\x1b[31m❌ FAIL:\x1b[0m ${msg}`);
  if (detail) console.error(`   Details:`, detail);
  failedTests++;
}

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, headers: res.headers, body: data }));
    });
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timed out after 5s'));
    });
    if (postData) req.write(postData);
    req.end();
  });
}

async function waitForServer(port, path = '/') {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    try {
      const res = await request({ host: '127.0.0.1', port, path, method: 'GET' });
      if (res.statusCode < 500) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} failed to start within 10s`);
}

async function runSmokeTests() {
  console.log('\n======================================================');
  console.log('   🧪 Running Jai Mata Di Auto Smoke Test Suite       ');
  console.log('======================================================\n');

  // 1. Start Backend on :3000
  console.log('[setup] Launching backend server on port 3000...');
  const backend = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: '3000', NODE_ENV: 'test' },
    stdio: 'ignore'
  });

  // 2. Start Frontend on :5173
  console.log('[setup] Launching static frontend server on port 5173...');
  const frontend = spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve-frontend.js')], {
    cwd: ROOT,
    env: { ...process.env, FRONTEND_PORT: '5173' },
    stdio: 'ignore'
  });

  const cleanup = () => {
    try { backend.kill('SIGKILL'); } catch (e) {}
    try { frontend.kill('SIGKILL'); } catch (e) {}
  };

  try {
    await waitForServer(3000, '/api/health');
    console.log('[ready] Backend is healthy on :3000');
    await waitForServer(5173, '/index.html');
    console.log('[ready] Frontend is serving on :5173\n');

    // Check 1: Backend Health Check
    const resHealth = await request({ host: '127.0.0.1', port: 3000, path: '/api/health', method: 'GET' });
    const healthJson = JSON.parse(resHealth.body);
    if (resHealth.statusCode === 200 && healthJson.status === 'ok') {
      logPass('GET /api/health returns 200 with status: ok');
    } else {
      logFail('GET /api/health failed', resHealth);
    }

    // Check 2: Protected Admin Route 401
    const resLeadsNoAuth = await request({ host: '127.0.0.1', port: 3000, path: '/api/admin/leads', method: 'GET' });
    if (resLeadsNoAuth.statusCode === 401) {
      logPass('GET /api/admin/leads rejects unauthenticated request with 401');
    } else {
      logFail('GET /api/admin/leads expected 401', resLeadsNoAuth.statusCode);
    }

    // Check 3: Private Database Exposure 404
    const resDataHidden = await request({ host: '127.0.0.1', port: 3000, path: '/data/leads.json', method: 'GET' });
    if (resDataHidden.statusCode === 404) {
      logPass('GET /data/leads.json returns 404 (database completely isolated)');
    } else {
      logFail('GET /data/leads.json returned sensitive data!', resDataHidden.statusCode);
    }

    // Check 4: Source Code Exposure 404
    const resSourceHidden = await request({ host: '127.0.0.1', port: 3000, path: '/server.js', method: 'GET' });
    if (resSourceHidden.statusCode === 404) {
      logPass('GET /server.js returns 404 (source code hidden)');
    } else {
      logFail('GET /server.js exposed server code!', resSourceHidden.statusCode);
    }

    // Check 5: Public Lead Submission POST /api/submit-lead
    const testLeadId = 'smoke-test-' + Date.now();
    const leadPayload = JSON.stringify({
      name: 'Smoke Test User',
      phone: '9876543210',
      email: 'smoke@test.local',
      model: 'Nexus ST',
      message: 'Automated smoke test ' + testLeadId,
      website: '' // honeypot empty
    });

    const resSubmit = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(leadPayload)
      }
    }, leadPayload);

    const submitJson = JSON.parse(resSubmit.body);
    if (resSubmit.statusCode === 200 && submitJson.success === true) {
      logPass('POST /api/submit-lead successfully captured lead');
    } else {
      logFail('POST /api/submit-lead failed', resSubmit.body);
    }

    // Verify lead stored in backend data
    const leadsFile = path.join(BACKEND_DIR, 'data', 'leads.json');
    if (fs.existsSync(leadsFile)) {
      const storedLeads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      const found = storedLeads.some(l => l.name === 'Smoke Test User' && l.phone === '9876543210');
      if (found) {
        logPass('Lead verification: Test lead found in data/leads.json');
        // Clean up test lead
        const cleaned = storedLeads.filter(l => !(l.name === 'Smoke Test User' && l.phone === '9876543210'));
        fs.writeFileSync(leadsFile, JSON.stringify(cleaned, null, 2), 'utf8');
      } else {
        logFail('Test lead was not found in data/leads.json');
      }
    }

    // Check 6: Frontend Index Page
    const resIndex = await request({ host: '127.0.0.1', port: 5173, path: '/index.html', method: 'GET' });
    if (resIndex.statusCode === 200 && resIndex.body.includes('Jai Mata Di Auto')) {
      logPass('GET http://localhost:5173/index.html returns 200 (Home Showcase)');
    } else {
      logFail('GET index.html failed', resIndex.statusCode);
    }

    // Check 7: Canonical Admin Login Page
    const resAdmin = await request({ host: '127.0.0.1', port: 5173, path: '/admin/login.html', method: 'GET' });
    if (resAdmin.statusCode === 200 && (resAdmin.body.includes('JMD Admin') || resAdmin.body.includes('login-card'))) {
      logPass('GET http://localhost:5173/admin/login.html returns 200 (Canonical Admin)');
    } else {
      logFail('GET /admin/login.html failed', resAdmin.statusCode);
    }

    // Check 8: Frontend Config.js
    const resConfig = await request({ host: '127.0.0.1', port: 5173, path: '/config.js', method: 'GET' });
    if (resConfig.statusCode === 200 && resConfig.body.includes('JMD_API_BASE')) {
      logPass('GET http://localhost:5173/config.js returns 200 (API Config)');
    } else {
      logFail('GET /config.js failed', resConfig.statusCode);
    }

    // Check 9: Full offline spare parts catalog removed from frontend & spare-parts.html returns 200
    const resPartsJson = await request({ host: '127.0.0.1', port: 5173, path: '/assets/data/spare-parts.json', method: 'GET' });
    const resPartsHtml = await request({ host: '127.0.0.1', port: 5173, path: '/spare-parts.html', method: 'GET' });
    if (resPartsJson.statusCode === 404 && resPartsHtml.statusCode === 200 && resPartsHtml.body.includes('spPagination')) {
      logPass('Spare parts frontend verified: full catalog removed (404), page serves with dynamic container (200)');
    } else {
      logFail('Spare parts check failed', { jsonStatus: resPartsJson.statusCode, htmlStatus: resPartsHtml.statusCode });
    }

    // Check 10: Public Dynamic Spare Parts API
    const resPartsApi = await request({ host: '127.0.0.1', port: 3000, path: '/api/public/spare-parts?page=1&limit=5', method: 'GET' });
    const partsApiJson = JSON.parse(resPartsApi.body);
    if (resPartsApi.statusCode === 200 && partsApiJson.success && partsApiJson.data.length === 5) {
      logPass('GET http://localhost:3000/api/public/spare-parts returns paginated parts');
    } else {
      logFail('GET /api/public/spare-parts failed', resPartsApi.statusCode);
    }

  } catch (err) {
    logFail('Unexpected error during test execution', err.message);
  } finally {
    cleanup();
    console.log('\n======================================================');
    console.log(`   Smoke Test Results: ${passedTests} passed, ${failedTests} failed`);
    console.log('======================================================\n');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runSmokeTests();

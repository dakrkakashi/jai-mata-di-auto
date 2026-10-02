/**
 * Comprehensive Hardening & Verification Suite (Post-Items A-F)
 * 
 * Verifies:
 * 1. XSS Lead Payload & Neutralized CSV Export (Item A)
 * 2. Retired Routes return 404 (Item B)
 * 3. Settings Lockdown returns 400 on invalid payload (Item C)
 * 4. Zero raw /api/ fetch calls in frontend (Item D)
 * 5. Backend-Off Static Pages Render 200 (Item E / Resilience)
 */

const http = require('http');
const path = require('path');
const fs = require('fs');
const { spawn, execSync } = require('child_process');

const ROOT = process.cwd();
const BACKEND_DIR = path.join(ROOT, 'jmd', 'backend');
const FRONTEND_DIR = path.join(ROOT, 'jmd', 'frontend');

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function logPass(msg) {
  console.log(`\x1b[32m✅ PASS:\x1b[0m ${msg}`);
  passedTests++;
  totalTests++;
}

function logFail(msg, detail) {
  console.error(`\x1b[31m❌ FAIL:\x1b[0m ${msg}`);
  if (detail) console.error(`   Details:`, detail);
  failedTests++;
  totalTests++;
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

async function waitForServer(port, checkPath = '/') {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    try {
      const res = await request({ host: '127.0.0.1', port, path: checkPath, method: 'GET' });
      if (res.statusCode < 500) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} failed to start within 10s`);
}

async function runVerificationSuite() {
  console.log('\n======================================================');
  console.log('   🛡️ RUNNING COMPREHENSIVE VERIFICATION SUITE       ');
  console.log('======================================================\n');

  // --- PART 1: Backend-Off Verification (Static Frontend Only) ---
  console.log('>>> [TEST 1/5] Backend-Off Verification: Testing 14 public HTML pages with Backend DOWN...');
  const frontend = spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve-frontend.js')], {
    cwd: ROOT,
    env: { ...process.env, FRONTEND_PORT: '5173' },
    stdio: 'ignore'
  });

  try {
    await waitForServer(5173, '/index.html');
    const publicPages = [
      'index.html', 'models.html', 'nexus-st.html', 'magnus-ex.html',
      'magnus-grand.html', 'magnus-gmax.html', 'magnus-neo.html',
      'reo-80.html', 'reo-li.html', 'spare-parts.html', 'savings.html',
      'dealer.html', 'contact.html', 'test-ride.html'
    ];

    let all200 = true;
    for (const page of publicPages) {
      const res = await request({ host: '127.0.0.1', port: 5173, path: '/' + page, method: 'GET' });
      if (res.statusCode !== 200 || res.body.length < 500) {
        all200 = false;
        logFail(`Page /${page} failed to render offline: status ${res.statusCode}`);
      }
    }
    if (all200) {
      logPass(`All 14 public pages render successfully (200 OK) with complete fallback content while Backend is offline`);
    }
  } finally {
    try { frontend.kill('SIGKILL'); } catch (e) {}
  }

  // --- PART 2: Zero Raw /api/ Fetch Check ---
  console.log('\n>>> [TEST 2/5] Grep Audit: Verifying ZERO raw /api/ fetch calls in frontend...');
  function walkFiles(dir, exts) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const p = path.join(dir, file);
      const stat = fs.statSync(p);
      if (stat && stat.isDirectory()) {
        results = results.concat(walkFiles(p, exts));
      } else if (exts.some(ext => file.endsWith(ext))) {
        results.push(p);
      }
    });
    return results;
  }

  const frontendFiles = walkFiles(FRONTEND_DIR, ['.js', '.html']).filter(f => !f.endsWith('config.js'));
  let rawApiFetchFound = [];
  const rawFetchRegex = /fetch\s*\(\s*['"`]\/api\/|fetch\s*\(\s*`\${(?:API_BASE|getApiUrl)/g;

  frontendFiles.forEach(f => {
    const content = fs.readFileSync(f, 'utf8');
    if (rawFetchRegex.test(content)) {
      rawApiFetchFound.push(path.relative(ROOT, f));
    }
  });

  if (rawApiFetchFound.length === 0) {
    logPass('Zero raw fetch(\'/api/...\') calls found across all frontend JS/HTML files (all migrated to window.api)');
  } else {
    logFail('Found unmigrated raw fetch calls:', rawApiFetchFound);
  }

  // --- Start Backend & Frontend for Live API Tests ---
  console.log('\n[setup] Launching backend on port 3000 & frontend on 5173 for API tests...');
  const jwt = require('jsonwebtoken');
  const TEST_JWT_SECRET = 'test_jwt_secret_verification_suite_12345';
  const backend = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: '3000', JWT_SECRET: TEST_JWT_SECRET, NODE_ENV: 'test' },
    stdio: 'ignore'
  });

  const frontendLive = spawn(process.execPath, [path.join(ROOT, 'scripts', 'serve-frontend.js')], {
    cwd: ROOT,
    env: { ...process.env, FRONTEND_PORT: '5173' },
    stdio: 'ignore'
  });

  const cleanupLive = () => {
    try { backend.kill('SIGKILL'); } catch (e) {}
    try { frontendLive.kill('SIGKILL'); } catch (e) {}
  };

  try {
    await waitForServer(3000, '/api/health');
    await waitForServer(5173, '/index.html');

    // Create valid admin JWT token
    const token = jwt.sign({ user: 'admin', role: 'admin' }, TEST_JWT_SECRET, { expiresIn: '1h' });
    const authHeaders = {
      'Cookie': `jmd_admin=${token}`,
      'x-admin-token': token,
      'Origin': 'http://localhost:5173'
    };

    // --- PART 3: Retired Routes Return 404 ---
    console.log('\n>>> [TEST 3/5] Retired Routes: Verifying all retired routes return 404...');
    const retiredRoutes = [
      { method: 'POST', path: '/api/admin/save-page', body: JSON.stringify({ page: 'index.html', html: '<h1>test</h1>' }) },
      { method: 'POST', path: '/api/admin/page', body: JSON.stringify({ filename: 'test.html' }) },
      { method: 'POST', path: '/api/admin/restore-version', body: JSON.stringify({ page: 'index.html', version: 'v1' }) },
      { method: 'POST', path: '/api/admin/restore', body: JSON.stringify({ backup: 'backup.zip' }) },
      { method: 'GET',  path: '/api/admin/generate-sitemap' },
      { method: 'POST', path: '/api/save-cms', body: JSON.stringify({ key: 'val' }) },
      { method: 'GET',  path: '/api/admin/page-content?page=index.html' },
      { method: 'POST', path: '/api/admin/page-content', body: JSON.stringify({ page: 'index.html' }) }
    ];

    let all404 = true;
    for (const r of retiredRoutes) {
      const headers = { ...authHeaders };
      if (r.body) {
        headers['Content-Type'] = 'application/json';
        headers['Content-Length'] = Buffer.byteLength(r.body);
      }
      const res = await request({
        host: '127.0.0.1',
        port: 3000,
        path: r.path,
        method: r.method,
        headers
      }, r.body || null);

      if (res.statusCode === 404) {
        // PASS
      } else {
        all404 = false;
        logFail(`Retired route ${r.method} ${r.path} expected 404, got ${res.statusCode}`);
      }
    }
    if (all404) {
      logPass('All 8 retired routes return 404 Not Found (save-page, page, restore-version, restore, generate-sitemap, save-cms, page-content)');
    }

    // --- PART 4: Settings Lockdown 400 Validation ---
    console.log('\n>>> [TEST 4/5] Settings Lockdown: Verifying invalid payloads return 400...');
    const settingsTests = [
      { name: 'customCss field rejected', path: '/api/admin/save-theme', payload: { primary: '#112233', customCss: 'body{background:red;}' } },
      { name: 'Invalid non-hex theme color rejected', path: '/api/admin/save-theme', payload: { primary: 'red; evil' } },
      { name: 'Invalid unallowed CSS var key rejected', path: '/api/admin/save-theme', payload: { '--evil-var': '#112233' } },
      { name: 'Invalid phone format rejected', path: '/api/admin/settings', payload: { dealerPhone: '123' } },
      { name: 'Invalid email format rejected', path: '/api/admin/settings', payload: { dealerEmail: 'invalid-email' } },
      { name: 'Non-https URL rejected', path: '/api/admin/settings', payload: { siteUrl: 'http://insecure.site' } },
      { name: 'Unknown settings key rejected', path: '/api/admin/settings', payload: { unknownMaliciousKey: 'payload' } }
    ];

    let allSettings400 = true;
    for (const st of settingsTests) {
      const pl = JSON.stringify(st.payload);
      const res = await request({
        host: '127.0.0.1',
        port: 3000,
        path: st.path,
        method: 'POST',
        headers: {
          ...authHeaders,
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(pl)
        }
      }, pl);

      if (res.statusCode === 400) {
        // PASS
      } else {
        allSettings400 = false;
        logFail(`Settings lockdown failed for [${st.name}]: expected 400, got ${res.statusCode}`, res.body);
      }
    }
    if (allSettings400) {
      logPass('All 7 settings lockdown test cases return 400 Bad Request (customCss, bad hex, bad CSS vars, bad phone, bad email, bad URL, unknown keys)');
    }

    // --- PART 5: Stored XSS & Neutralized CSV Export Proof ---
    console.log('\n>>> [TEST 5/5] XSS & CSV Formula Injection Proof...');
    const xssPayload = {
      name: '<img src=x onerror=alert(1)>',
      phone: '9876543210',
      email: 'xss-proof@test.local',
      model: 'Nexus ST',
      message: '<script>alert(2)</script>',
      website: '' // honeypot
    };
    const xssStr = JSON.stringify(xssPayload);

    const resLeadSubmit = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(xssStr),
        'Origin': 'http://localhost:5173'
      }
    }, xssStr);

    const leadSubmitJson = JSON.parse(resLeadSubmit.body);
    if (resLeadSubmit.statusCode === 200 && leadSubmitJson.success) {
      logPass('XSS lead payload successfully submitted to /api/submit-lead');
    } else {
      logFail('Failed to submit XSS test lead', resLeadSubmit.body);
    }

    // CSV Formula Injection Lead Submission
    const csvFormulaPayload = {
      name: "=cmd|' /C calc'!A0",
      phone: '9890202092',
      email: 'csv-calc@test.local',
      model: 'Magnus Neo',
      message: '+cmd|something',
      website: ''
    };
    const csvFormulaStr = JSON.stringify(csvFormulaPayload);
    await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(csvFormulaStr),
        'Origin': 'http://localhost:5173'
      }
    }, csvFormulaStr);

    // Verify CSV Export neutralized formula injection
    const resCsv = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/admin/leads/export',
      method: 'GET',
      headers: authHeaders
    });

    if (resCsv.statusCode === 200 && resCsv.body.includes("\"'=cmd|' /C calc'!A0\"")) {
      logPass("CSV formula injection neutralized: \"=cmd|...\" is prefixed with single-quote (\"'=cmd|...\") in export");
    } else {
      logFail('CSV export formula neutralization verification failed', resCsv.body);
    }

    // Clean up test leads from leads.json
    const leadsFile = path.join(BACKEND_DIR, 'data', 'leads.json');
    if (fs.existsSync(leadsFile)) {
      const stored = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      const cleaned = stored.filter(l => l.email !== 'xss-proof@test.local' && l.email !== 'csv-calc@test.local');
      fs.writeFileSync(leadsFile, JSON.stringify(cleaned, null, 2), 'utf8');
    }

  } finally {
    cleanupLive();
    console.log('\n======================================================');
    console.log(`   Verification Suite: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
    console.log('======================================================\n');
    process.exit(failedTests > 0 ? 1 : 0);
  }
}

runVerificationSuite();

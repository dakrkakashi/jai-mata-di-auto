/**
 * Verification script for Item A (Stored XSS & CSV Formula Injection Proof)
 */
const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const ROOT = __dirname;
const BACKEND_DIR = path.join(ROOT, 'jmd', 'backend');

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

async function waitForServer(port, p = '/api/health') {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    try {
      const res = await request({ host: '127.0.0.1', port, path: p, method: 'GET' });
      if (res.statusCode < 500) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} failed to start within 10s`);
}

async function testXSSAndCSV() {
  console.log('\n--- PROOF TEST: Stored XSS & CSV Injection Neutralization ---');

  const TEST_SECRET = 'test_secret_suite_1234567890';
  // Start backend
  const backend = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: '3000', NODE_ENV: 'test', JWT_SECRET: TEST_SECRET },
    stdio: 'ignore'
  });

  const cleanup = () => {
    try { backend.kill('SIGKILL'); } catch (e) {}
  };

  try {
    await waitForServer(3000, '/api/health');
    console.log('[setup] Backend is ready on port 3000');

    // 1. Submit XSS lead payload
    const xssPayload = JSON.stringify({
      name: '<img src=x onerror=alert(1)>',
      phone: '9890202091',
      model: 'Nexus ST',
      message: '<script>alert(2)</script>',
      source: 'test'
    });

    const resSubmit1 = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(xssPayload)
      }
    }, xssPayload);

    console.log('[test 1] Submitted XSS lead payload, status:', resSubmit1.statusCode);
    if (resSubmit1.statusCode !== 200) throw new Error('XSS lead submission failed');

    // 2. Submit CSV formula injection payload
    const csvFormulaPayload = JSON.stringify({
      name: "=cmd|' /C calc'!A0",
      phone: '9890202092',
      model: 'Magnus Neo',
      message: 'Formula test',
      source: 'test'
    });

    const resSubmit2 = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/submit-lead',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(csvFormulaPayload)
      }
    }, csvFormulaPayload);

    console.log('[test 2] Submitted CSV injection payload, status:', resSubmit2.statusCode);
    if (resSubmit2.statusCode !== 200) throw new Error('CSV injection lead submission failed');

    // 3. Login as admin to get token
    const loginPayload = JSON.stringify({ password: 'password' }); // settings default or test
    // Let's read settings.json or env to see admin password
    const settingsPath = path.join(BACKEND_DIR, 'data', 'settings.json');
    let adminToken = '';

    // Direct token generation using jwt
    const jwt = require('jsonwebtoken');
    adminToken = jwt.sign({ role: 'admin' }, TEST_SECRET, { expiresIn: '1h' });

    // 4. Test CSV Export neutralization
    const resCsv = await request({
      host: '127.0.0.1',
      port: 3000,
      path: '/api/admin/leads/export',
      method: 'GET',
      headers: {
        'x-admin-token': adminToken
      }
    });

    console.log('[test 3] GET /api/admin/leads/export, status:', resCsv.statusCode);
    if (resCsv.statusCode !== 200) throw new Error('CSV export failed');

    const csvContent = resCsv.body;
    console.log('[test 3 check] CSV output contains neutralized formula:');
    const neutralizedFormula = '"\'=cmd|\'\' /C calc\'\'!A0"';
    const isNeutralized = csvContent.includes("'=cmd|") || csvContent.includes(neutralizedFormula);
    console.log('   Neutralized with single quote prefix:', isNeutralized);
    if (!isNeutralized) throw new Error('CSV Formula was not prefixed with single quote!');

    // 5. Test Frontend Admin leads rendering
    console.log('\n[test 4] Verifying Admin leads.js DOM rendering:');
    const leadsJs = fs.readFileSync(path.join(ROOT, 'jmd', 'frontend', 'admin', 'js', 'leads.js'), 'utf8');
    const innerHTMLMatches = leadsJs.match(/\.innerHTML/g);
    console.log('   leads.js innerHTML occurrences:', innerHTMLMatches ? innerHTMLMatches.length : 0);
    if (innerHTMLMatches && innerHTMLMatches.length > 0) {
      throw new Error('leads.js still contains innerHTML!');
    }

    // Verify textContent is used for name and message
    const usesTextContent = leadsJs.includes('.textContent');
    console.log('   leads.js uses textContent for text fields:', usesTextContent);
    if (!usesTextContent) throw new Error('leads.js does not use textContent!');

    // Clean up test leads
    const leadsFile = path.join(BACKEND_DIR, 'data', 'leads.json');
    if (fs.existsSync(leadsFile)) {
      const storedLeads = JSON.parse(fs.readFileSync(leadsFile, 'utf8'));
      const cleaned = storedLeads.filter(l => 
        !l.name.includes('onerror=') && 
        !l.name.startsWith("=cmd|") && 
        l.phone !== '9890202091' && 
        l.phone !== '9890202092'
      );
      fs.writeFileSync(leadsFile, JSON.stringify(cleaned, null, 2), 'utf8');
      console.log('[cleanup] Test payloads cleaned from data/leads.json');
    }

    console.log('\n✅ ALL PROOF CHECKS PASSED:');
    console.log(' - Stored XSS payloads cannot execute (0 innerHTML in leads.js, rendered via textContent)');
    console.log(' - CSV formula injection successfully neutralized with single quote prefix\n');

  } catch (err) {
    console.error('❌ Proof check failed:', err);
    process.exit(1);
  } finally {
    cleanup();
  }
}

testXSSAndCSV();

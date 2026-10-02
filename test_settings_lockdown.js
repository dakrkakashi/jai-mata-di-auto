/**
 * Automated Verification for Item C: Settings and Theme Lockdown
 * Verifies that:
 * 1. Unknown settings keys return 400
 * 2. customCss is rejected with 400 in settings and theme
 * 3. Invalid Indian phone formats return 400
 * 4. Invalid email formats return 400
 * 5. Non-https URLs return 400
 * 6. Opening hours > 200 chars return 400
 * 7. Passwords < 6 chars return 400
 * 8. Unknown theme CSS vars return 400
 * 9. Non-hex theme colors return 400
 * 10. Valid settings and theme requests return 200
 */

const http = require('http');
const { spawn } = require('child_process');
const path = require('path');
const jwt = require('jsonwebtoken');

const ROOT = __dirname;
const BACKEND_DIR = path.join(ROOT, 'jmd', 'backend');
const TEST_PORT = 3009;
const TEST_SECRET = 'test_secret_settings_lockdown_1234567890';
const adminToken = jwt.sign({ role: 'admin', user: 'admin' }, TEST_SECRET, { expiresIn: '1h' });

function request(options, body = null) {
  return new Promise((resolve, reject) => {
    const postData = body ? (typeof body === 'string' ? body : JSON.stringify(body)) : null;
    const reqOpts = {
      ...options,
      headers: {
        ...options.headers,
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    const req = http.request(reqOpts, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        let json = null;
        try { json = JSON.parse(data); } catch (e) {}
        resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data });
      });
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

async function waitForServer(port) {
  const start = Date.now();
  while (Date.now() - start < 10000) {
    try {
      const res = await request({ host: '127.0.0.1', port, path: '/api/health', method: 'GET' });
      if (res.status < 500) return true;
    } catch (e) {
      await new Promise(r => setTimeout(r, 200));
    }
  }
  throw new Error(`Server on port ${port} failed to start within 10s`);
}

async function run() {
  console.log('=== Item C: Settings & Theme Lockdown Verification ===\n');

  // Spawn isolated test backend on TEST_PORT
  const backend = spawn(process.execPath, ['server.js'], {
    cwd: BACKEND_DIR,
    env: { ...process.env, PORT: String(TEST_PORT), NODE_ENV: 'test', JWT_SECRET: TEST_SECRET },
    stdio: 'ignore'
  });

  const cleanup = () => {
    try { backend.kill('SIGKILL'); } catch (e) {}
  };

  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);

  try {
    await waitForServer(TEST_PORT);
    console.log(`[setup] Isolated test backend started on port ${TEST_PORT}\n`);

    let failures = 0;

    async function testCase(name, p, method, payload, expectedStatus) {
      const res = await request({
        hostname: '127.0.0.1',
        port: TEST_PORT,
        path: p,
        method,
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken
        }
      }, payload);

      if (res.status === expectedStatus) {
        console.log(`[PASS] ${name} -> ${res.status}`);
        return true;
      } else {
        console.error(`[FAIL] ${name} -> Expected ${expectedStatus}, got ${res.status}:`, res.body || res.raw);
        failures++;
        return false;
      }
    }

    // 1. Unknown settings key
    await testCase(
      'Settings: unknown key rejected',
      '/api/admin/settings',
      'POST',
      { unknownField123: 'hacked' },
      400
    );

    // 2. customCss in settings rejected
    await testCase(
      'Settings: customCss rejected',
      '/api/admin/settings',
      'POST',
      { customCss: 'body { display: none; }' },
      400
    );

    // 3. Invalid phone format rejected
    await testCase(
      'Settings: invalid phone "12345" rejected',
      '/api/admin/settings',
      'POST',
      { phone: '12345' },
      400
    );

    // 4. Invalid phone format (starts with 1) rejected
    await testCase(
      'Settings: invalid phone "+91-1234567890" rejected',
      '/api/admin/settings',
      'POST',
      { phone: '+91-1234567890' },
      400
    );

    // 5. Invalid email format rejected
    await testCase(
      'Settings: invalid email "not-an-email" rejected',
      '/api/admin/settings',
      'POST',
      { email: 'not-an-email' },
      400
    );

    // 6. Non-https URL rejected
    await testCase(
      'Settings: http URL for instagram rejected',
      '/api/admin/settings',
      'POST',
      { instagram: 'http://instagram.com/test' },
      400
    );

    // 7. Javascript URL rejected
    await testCase(
      'Settings: javascript: URL rejected',
      '/api/admin/settings',
      'POST',
      { facebook: 'javascript:alert(1)' },
      400
    );

    // 8. Opening hours exceeding 200 chars rejected
    await testCase(
      'Settings: opening hours > 200 chars rejected',
      '/api/admin/settings',
      'POST',
      { dealerHours: 'A'.repeat(201) },
      400
    );

    // 9. Short password rejected
    await testCase(
      'Settings: password < 6 chars rejected',
      '/api/admin/settings',
      'POST',
      { newPassword: '123' },
      400
    );

    // 10. Theme: customCss rejected
    await testCase(
      'Theme: customCss rejected',
      '/api/admin/save-theme',
      'POST',
      { customCss: 'body { background: black; }' },
      400
    );

    // 11. Theme: unknown variable rejected
    await testCase(
      'Theme: unknown CSS variable rejected',
      '/api/admin/save-theme',
      'POST',
      { '--my-custom-var': '#112233' },
      400
    );

    // 12. Theme: non-hex color rejected
    await testCase(
      'Theme: non-hex color "red" rejected',
      '/api/admin/save-theme',
      'POST',
      { '--color-primary': 'red' },
      400
    );

    // 13. Theme: valid hex color and allowed variable accepted
    await testCase(
      'Theme: valid hex color and allowed CSS var accepted',
      '/api/admin/save-theme',
      'POST',
      { '--color-primary': '#00F59B' },
      200
    );

    // 14. Settings: valid updates accepted
    await testCase(
      'Settings: valid Indian phone, email, and https URL accepted',
      '/api/admin/settings',
      'POST',
      {
        phone: '+91-9890202091',
        whatsapp: '919890202091',
        email: 'jmdanirmal91@gmail.com',
        instagram: 'https://instagram.com/jmdauto',
        dealerHours: 'Monday – Saturday: 9:30 AM – 6:30 PM'
      },
      200
    );

    console.log(`\nItem C Verification finished with ${failures} failures.`);
    cleanup();
    if (failures > 0) process.exit(1);
    else process.exit(0);
  } catch (err) {
    console.error('Test run error:', err);
    cleanup();
    process.exit(1);
  }
}

run();

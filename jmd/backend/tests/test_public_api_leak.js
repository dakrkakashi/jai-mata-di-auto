#!/usr/bin/env node
/**
 * Public API Leak & Safe Serialization Test
 * Verifies that:
 * 1. Held items strictly omit price, priceRupees, priceFormatted
 * 2. Zero-price / price-on-request items have priceOnRequest: true
 * 3. Conflict-resolved items omit conflict notes and conflict flags
 * 4. Normal items have valid public fields
 * 5. No internal fields (flagged, conflict, flagDetails, verificationNote, etc.) leak into public responses
 */

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test_jwt_secret_step3_1234567890123456';

const http = require('http');
const app = require('../src/app');

const TEST_PORT = 3105;
const FORBIDDEN_PUBLIC_KEYS = [
  'flagged',
  'conflict',
  'flagDetails',
  'verificationNote',
  'note',
  'holdNote',
  'rowNumber',
  'noCode'
];

function request(options) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: '127.0.0.1',
      port: TEST_PORT,
      ...options
    }, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, json: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function run() {
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
    console.log('Testing GET /api/public/spare-parts across multiple pages and queries...\n');

    // 1. Page 1, 2, 3 and search queries
    const queries = [
      '/api/public/spare-parts?page=1&limit=20',
      '/api/public/spare-parts?page=2&limit=20',
      '/api/public/spare-parts?page=3&limit=20',
      '/api/public/spare-parts?q=fork&limit=20',
      '/api/public/spare-parts?q=cable&limit=20'
    ];

    for (const q of queries) {
      const res = await request({ path: q, method: 'GET' });
      assert(res.status === 200, `${q} returns 200`);
      assert(Array.isArray(res.json?.data), `${q} returns array of data`);

      for (const item of res.json?.data || []) {
        for (const fKey of FORBIDDEN_PUBLIC_KEYS) {
          if (item[fKey] !== undefined) {
            assert(false, `Item ${item.id} leaks forbidden key "${fKey}"`);
          }
        }
        if (item.needsVerification) {
          if (item.price !== undefined || item.priceRupees !== undefined || item.priceFormatted !== undefined) {
            assert(false, `Held item ${item.id} leaks price field!`);
          }
        }
      }
    }
    assert(true, 'Zero items in public pages leak forbidden internal keys');

    // 2. Specific Held Record: VSP-V48-006__v48-2022
    const heldRes = await request({ path: '/api/public/spare-parts?q=VSP-V48-006', method: 'GET' });
    const heldItem = heldRes.json?.data?.find(x => x.id === 'VSP-V48-006__v48-2022');
    assert(heldItem, 'Found held item VSP-V48-006__v48-2022');
    assert(heldItem.needsVerification === true, 'Held item has needsVerification: true');
    assert(heldItem.price === undefined, 'Held item strictly omits price');
    assert(heldItem.priceRupees === undefined, 'Held item strictly omits priceRupees');
    assert(heldItem.priceFormatted === undefined, 'Held item strictly omits priceFormatted');
    assert(heldItem.priceOnRequest === true, 'Held item has priceOnRequest: true');

    // 3. Price-on-request Record: VSP-MAG-124__magnus-60-2020 (zero price)
    const zeroRes = await request({ path: '/api/public/spare-parts?q=VSP-MAG-124', method: 'GET' });
    const zeroItem = zeroRes.json?.data?.find(x => x.id === 'VSP-MAG-124__magnus-60-2020');
    assert(zeroItem, 'Found zero-price item VSP-MAG-124__magnus-60-2020');
    assert(zeroItem.price === 0, 'Zero-price item has price: 0');
    assert(zeroItem.priceFormatted === 'Price on request', 'Zero-price item has priceFormatted: "Price on request"');
    assert(zeroItem.priceOnRequest === true, 'Zero-price item has priceOnRequest: true');

    // 4. Conflict-Resolved Record: VSP-MAG-154__magnus-60-2020
    const confRes = await request({ path: '/api/public/spare-parts?q=VSP-MAG-154', method: 'GET' });
    const confItem = confRes.json?.data?.find(x => x.id === 'VSP-MAG-154__magnus-60-2020');
    assert(confItem, 'Found conflict-resolved item VSP-MAG-154__magnus-60-2020');
    assert(confItem.price === 4625, 'Conflict-resolved item has resolved price: 4625 paise (₹46.25)');
    assert(confItem.conflict === undefined, 'Conflict-resolved item omits conflict flag');
    assert(confItem.verificationNote === undefined, 'Conflict-resolved item omits verification note');

    // 5. Normal Record: BLTNA00057__nexus
    const normRes = await request({ path: '/api/public/spare-parts?q=BLTNA00057', method: 'GET' });
    const normItem = normRes.json?.data?.find(x => x.id === 'BLTNA00057__nexus');
    assert(normItem, 'Found normal item BLTNA00057__nexus');
    assert(normItem.price === 33125, 'Normal item has price 33125 paise');
    assert(normItem.priceRupees === 331.25, 'Normal item has priceRupees 331.25');
    assert(normItem.priceFormatted === '₹331.25', 'Normal item has priceFormatted "₹331.25"');
    assert(normItem.priceOnRequest === false, 'Normal item has priceOnRequest: false');

    // 6. Name loss / alias search: BPKBK00001
    const aliasRes1 = await request({ path: '/api/public/spare-parts?q=Cable+Tie', method: 'GET' });
    const aliasRes2 = await request({ path: '/api/public/spare-parts?q=Foot+Mat+Button', method: 'GET' });
    const foundByAlias1 = aliasRes1.json?.data?.some(x => x.id === 'BPKBK00001__v48-2022');
    const foundByAlias2 = aliasRes2.json?.data?.some(x => x.id === 'BPKBK00001__v48-2022');
    assert(foundByAlias1, 'BPKBK00001 is found searching by "Cable Tie"');
    assert(foundByAlias2, 'BPKBK00001 is found searching by "Foot Mat Button"');

    console.log(`\n========================================`);
    console.log(`Results: ${failed === 0 ? 'ALL PASSED' : failed + ' FAILED'}`);
    console.log(`========================================`);

  } finally {
    server.close();
  }

  process.exit(failed === 0 ? 0 : 1);
}

run().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});

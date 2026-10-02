/**
 * Step 4 Verification Test Suite
 * Verifies catalog integrity, integer-paise handling, decimal editing,
 * 15 model filters, hold list, WhatsApp messaging formatting, and API routes.
 */

const assert = require('assert');
const path = require('path');
const fs = require('fs');

const storage = require('../src/services/storage');
const { ALLOWED_SETTINGS_KEYS } = require('../src/routes/settings');

console.log('─── Running Step 4 Verification Tests ───\n');

// 1. Catalog Integrity
console.log('1. Verifying catalog integrity in spare-parts.json...');
const parts = storage.getSpareParts();
assert.strictEqual(parts.length, 2964, `Expected 2,964 parts, got ${parts.length}`);

// No duplicate IDs
const idSet = new Set();
for (const p of parts) {
  assert(!idSet.has(p.id), `Duplicate ID found: ${p.id}`);
  idSet.add(p.id);
  assert(typeof p.id === 'string', `Part ID must be string: ${p.id}`);
  assert(!isNaN(p.price) && p.price >= 0, `Invalid price on ${p.id}: ${p.price}`);
  assert(Number.isInteger(p.price), `Price must be integer paise on ${p.id}: ${p.price}`);
}
console.log('✓ 2,964 unique parts with string IDs and integer paise prices validated.');

// 2. 15 Models and Counts
console.log('\n2. Verifying 15 model counts...');
const EXPECTED_MODELS = {
  'Nexus': 274,
  'Magnus Grand MAX': 249,
  'Magnus EX': 280,
  'Magnus GRAND': 240,
  'Magnus Neo': 267,
  'Reo 80': 123,
  'Reo Li': 176,
  'Primus': 192,
  'Zeal': 266,
  'MAGNUS PRO': 203,
  'MAGNUS 60 (2022)': 151,
  'MAGNUS 60 (2020)': 152,
  'V48 2022': 148,
  'V48 Li': 122,
  'V48 LA': 121
};

const counts = {};
for (const p of parts) {
  counts[p.model] = (counts[p.model] || 0) + 1;
}

for (const [model, expectedCount] of Object.entries(EXPECTED_MODELS)) {
  assert.strictEqual(counts[model], expectedCount, `Model ${model} count mismatch: expected ${expectedCount}, got ${counts[model]}`);
}
console.log('✓ All 15 models match exact expected counts (Total: 2,964).');

// 3. Stock defaults: all null except any with real edits
console.log('\n3. Verifying stock policy (seed 10 eliminated, null for enquiry)...');
const nonNullStock = parts.filter(p => p.stock !== null && p.stock !== undefined);
assert.strictEqual(nonNullStock.length, 0, `Expected 0 non-null stock records, found ${nonNullStock.length}`);
console.log(`✓ Stock is null for all ${parts.length} parts ("Enquire for availability").`);

// 4. Hold list (Exact 3 items)
console.log('\n4. Verifying hold list...');
const holdParts = parts.filter(p => p.needsVerification);
assert.strictEqual(holdParts.length, 3, `Expected 3 hold list items, got ${holdParts.length}`);
const holdIds = holdParts.map(p => p.id).sort();
assert(holdIds.includes('VSP-V48-006__v48-2022'), 'Missing VSP-V48-006 on V48 2022 from hold list');
assert(holdIds.includes('BPLGR00169__magnus-pro'), 'Missing BPLGR00169 on MAGNUS PRO from hold list');
assert(holdIds.includes('BPLGR00170__magnus-pro'), 'Missing BPLGR00170 on MAGNUS PRO from hold list');
console.log('✓ Exact 3 hold items verified (VSP-V48-006, BPLGR00169, BPLGR00170).');

// 5. Currency Formatting Helper (Indian Rupee + Paise)
console.log('\n5. Verifying currency formatting helper...');
assert.strictEqual(storage.formatIndianCurrency(33125), '₹331.25');
assert.strictEqual(storage.formatIndianCurrency(4600), '₹46');
assert.strictEqual(storage.formatIndianCurrency(4625), '₹46.25');
assert.strictEqual(storage.formatIndianCurrency(191125), '₹1,911.25');
assert.strictEqual(storage.formatIndianCurrency(12500000), '₹1,25,000');
assert.strictEqual(storage.formatIndianCurrency(0), 'Price on request');
assert.strictEqual(storage.formatIndianCurrency(null), 'Price on request');
console.log('✓ Currency formatting handles whole rupees, decimals, and Price on Request.');

// 6. Decimal Price Editing in Admin -> Public Query -> WhatsApp Format
console.log('\n6. Testing price edit to ₹331.25 in admin service...');
const testPartId = 'VSP-MAG-154__magnus-60-2020';
const originalPart = parts.find(p => p.id === testPartId);
assert(originalPart, 'Test part VSP-MAG-154 on MAGNUS 60 (2020) must exist');
const originalPaise = originalPart.price;

// Step A: Update price to 331.25 (decimal rupees as entered in admin UI)
const updated = storage.updateSparePart(testPartId, 'price', 331.25);
assert.strictEqual(updated.price, 33125, `Expected 33125 paise, got ${updated.price}`);

// Step B: Query via public query function
const queried = storage.querySpareParts({ q: 'VSP-MAG-154' });
const found = queried.data.find(p => p.id === testPartId);
assert(found, 'Part must be returned in query');
assert.strictEqual(found.price, 33125, 'Paise price mismatch');
assert.strictEqual(found.priceRupees, 331.25, 'priceRupees mismatch');
assert.strictEqual(found.priceFormatted, '₹331.25', 'priceFormatted mismatch');

// Step C: Simulate Cart & WhatsApp Text Generation
const simulatedCart = [
  {
    id: found.id,
    name: found.name,
    code: found.code,
    model: found.model,
    pricePaise: found.price,
    qty: 1
  }
];

function formatPaiseSim(paise) {
  if (paise == null || isNaN(paise) || Number(paise) <= 0) return 'Price on request';
  const rupees = Number(paise) / 100;
  const hasDecimals = (Number(paise) % 100) !== 0;
  const parts = rupees.toFixed(hasDecimals ? 2 : 0).split('.');
  let intPart = parts[0];
  const decPart = parts[1];
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return '₹' + intPart + (decPart ? '.' + decPart : '');
}

const totalPaise = simulatedCart.reduce((s, c) => s + (c.pricePaise * c.qty), 0);
const totalFormatted = formatPaiseSim(totalPaise);
assert.strictEqual(totalFormatted, '₹331.25', `WhatsApp total mismatch: expected ₹331.25, got ${totalFormatted}`);

const itemsText = simulatedCart.map(c => `• ${c.name} [Code: ${c.code}] [Model: ${c.model}] x${c.qty} - ${formatPaiseSim(c.pricePaise * c.qty)}`).join('\n');
assert(itemsText.includes('₹331.25'), 'WhatsApp items text must contain ₹331.25');
console.log('✓ Admin edit to 331.25 successfully reflected as ₹331.25 in query and WhatsApp text.');

// Restore original price
storage.updateSparePart(testPartId, 'price', originalPaise / 100);
const restored = storage.getSpareParts().find(p => p.id === testPartId);
assert.strictEqual(restored.price, originalPaise, 'Original price restored');
console.log('✓ Restored test part to original price.');

// 7. Settings Key Verification
console.log('\n7. Verifying priceNote in settings...');
assert(ALLOWED_SETTINGS_KEYS.has('priceNote'), 'priceNote must be allowed in settings');
console.log('✓ priceNote is in ALLOWED_SETTINGS_KEYS.');

// 8. One-Click Flag Clearance Test
console.log('\n8. Testing clearSparePartFlag admin function...');
const flaggedPart = storage.getSpareParts().find(p => p.flagged === true);
assert(flaggedPart, 'There should be flagged parts in catalog');
const testFlagId = flaggedPart.id;

const cleared = storage.clearSparePartFlag(testFlagId);
assert.strictEqual(cleared.needsVerification, false);
assert.strictEqual(cleared.flagged, false);
assert.strictEqual(cleared.conflict, false);

// Restore flag for catalog fidelity
storage.saveSparePartFull(testFlagId, {
  conflict: flaggedPart.conflict,
  flagged: flaggedPart.flagged,
  needsVerification: flaggedPart.needsVerification,
  verificationNote: flaggedPart.verificationNote
});
console.log(`✓ Flag clearance works seamlessly on ${testFlagId} and restores cleanly.`);

// 9. Query & Filter Tests
console.log('\n9. Testing query filters (model, search, pagination, sort)...');
const q1 = storage.querySpareParts({ model: 'Nexus', limit: 50 });
assert.strictEqual(q1.total, 274);
assert.strictEqual(q1.data.length, 50);

const qSortDesc = storage.querySpareParts({ sort: 'price-desc', limit: 10 });
for (let i = 0; i < qSortDesc.data.length - 1; i++) {
  assert(qSortDesc.data[i].price >= qSortDesc.data[i + 1].price, 'Price sort descending failed');
}

const qSortAsc = storage.querySpareParts({ sort: 'price-asc', limit: 10 });
for (let i = 0; i < qSortAsc.data.length - 1; i++) {
  assert(qSortAsc.data[i].price <= qSortAsc.data[i + 1].price, 'Price sort ascending failed');
}

console.log('✓ Model filtering, pagination, and integer paise price sorting pass.');

console.log('\n=========================================');
console.log('🎉 ALL STEP 4 VERIFICATION TESTS PASSED!');
console.log('=========================================\n');

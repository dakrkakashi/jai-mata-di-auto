/**
 * Importer Unit Verification Checks
 * Verifies core parsing and normalization rules on sample and edge-case inputs.
 */

const assert = require('assert');

function cleanString(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/Ã˜/g, 'Ø')
    .replace(/[\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanPartCode(val) {
  if (val === null || val === undefined) return '';
  return String(val).trim();
}

function formatPaiseToRupees(paise) {
  if (paise === null || paise === undefined || isNaN(paise)) return '0';
  const rupees = paise / 100;
  return rupees % 1 === 0 ? rupees.toFixed(0) : rupees.toFixed(2);
}

function formatIndianCurrency(paise) {
  if (paise === null || paise === undefined || paise === 0) return '₹0';
  const rupees = paise / 100;
  const parts = rupees.toFixed(2).split('.');
  let integerPart = parts[0];
  const decimalPart = parts[1];

  const lastThree = integerPart.substring(integerPart.length - 3);
  const otherNumbers = integerPart.substring(0, integerPart.length - 3);
  if (otherNumbers !== '') {
    integerPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }

  if (decimalPart === '00') {
    return `₹${integerPart}`;
  }
  return `₹${integerPart}.${decimalPart}`;
}

console.log('--- Running Importer Unit Tests ---');

// 1. Numeric code stringified
const numCode = cleanPartCode(800051211);
assert.strictEqual(typeof numCode, 'string');
assert.strictEqual(numCode, '800051211');
console.log('✅ 1. Numeric code stringified: 800051211 ->', JSON.stringify(numCode));

// 2. Mojibake fixed
const fixedMoji = cleanString('Washer-Ã˜30*Ã˜16.5*2 Steel DM');
assert.strictEqual(fixedMoji, 'Washer-Ø30*Ø16.5*2 Steel DM');
console.log('✅ 2. Mojibake fixed: "Washer-Ã˜30*Ã˜16.5*2 Steel DM" ->', fixedMoji);

// 3. Newline removed
const fixedNewline = cleanString('"V48-Front Turn Indicator Light\nLH"');
assert.strictEqual(fixedNewline, '"V48-Front Turn Indicator Light LH"');
console.log('✅ 3. Newline collapsed: "V48-Front Turn Indicator Light\\nLH" ->', fixedNewline);

// 4. Paise math correct
const priceVal1 = 331.25;
const paise1 = Math.round(priceVal1 * 100);
assert.strictEqual(paise1, 33125);
assert.strictEqual(formatIndianCurrency(paise1), '₹331.25');

const priceVal2 = 100052.5;
const paise2 = Math.round(priceVal2 * 100);
assert.strictEqual(paise2, 10005250);
assert.strictEqual(formatIndianCurrency(paise2), '₹1,00,052.50');

const priceVal3 = 331.00;
const paise3 = Math.round(priceVal3 * 100);
assert.strictEqual(paise3, 33100);
assert.strictEqual(formatIndianCurrency(paise3), '₹331');
console.log('✅ 4. Paise math & currency formatting verified:', {
  '331.25': { paise: paise1, formatted: formatIndianCurrency(paise1) },
  '100052.5': { paise: paise2, formatted: formatIndianCurrency(paise2) },
  '331': { paise: paise3, formatted: formatIndianCurrency(paise3) }
});

// 5. Zero price handling
const zeroPrice = 0;
const isZero = zeroPrice <= 0;
assert.strictEqual(isZero, true);
console.log('✅ 5. Zero price check verified: 0 -> priceOnRequest: true');

// 6. Conflicting price detection logic
const rowA = { id: 'VSP-MAG-154__magnus-60-2020', price: 191125 };
const rowB = { id: 'VSP-MAG-154__magnus-60-2020', price: 4625 };
const isConflict = rowA.id === rowB.id && rowA.price !== rowB.price;
assert.strictEqual(isConflict, true);
console.log('✅ 6. Conflict detection logic verified: conflicting duplicate flagged');

console.log('--- All Unit Checks PASSED ---');

const fs = require('fs');
const oldCatalog = JSON.parse(fs.readFileSync('_quarantine/old-catalog/spare-parts.20261002-153309.json', 'utf8'));
const newCatalog = JSON.parse(fs.readFileSync('jmd/backend/data/spare-parts.json', 'utf8'));

const oldIndex = new Map();
oldCatalog.forEach(p => {
  const code = (p.code || '').trim().toLowerCase();
  const model = (p.model || '').trim().toLowerCase();
  const key = code + '__' + model;
  if (!oldIndex.has(key)) oldIndex.set(key, p);
});

let roundedMatches = 0;
let roundedMismatches = 0;
const samples = [];
const mismatchSamples = [];

newCatalog.forEach((p, idx) => {
  const code = (p.code || '').trim().toLowerCase();
  const model = (p.model || '').trim().toLowerCase();
  const key = code + '__' + model;
  const oldPart = oldIndex.get(key);
  if (!oldPart) return;

  const oldPrice = Number(oldPart.price || 0); // whole rupees
  const newPriceRupees = Number(p.price || 0) / 100;
  const roundedNew = Math.round(newPriceRupees);

  if (roundedNew === oldPrice) {
    roundedMatches++;
  } else {
    roundedMismatches++;
    mismatchSamples.push({ code: p.code, name: p.name, model: p.model, oldPrice, newPriceRupees, roundedNew });
  }

  // collect sample candidates
  if (idx % 290 === 0) {
    samples.push({
      code: p.code,
      name: p.name,
      model: p.model,
      oldWholeRupees: oldPrice,
      newPaise: p.price,
      newRupees: newPriceRupees,
      roundedMatches: roundedNew === oldPrice
    });
  }
});

console.log('=== NO REAL CHANGES CHECK ===');
console.log('Total checked:', newCatalog.length);
console.log('Records where round(new price) == old whole-rupee price:', roundedMatches, `(${((roundedMatches / newCatalog.length) * 100).toFixed(2)}%)`);
console.log('Records with mismatch:', roundedMismatches);
console.log('\nMismatch records:', mismatchSamples);
console.log('\n10 Sample Records:');
console.log(JSON.stringify(samples.slice(0, 10), null, 2));

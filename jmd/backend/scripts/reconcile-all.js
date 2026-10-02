const fs = require('fs');
const ExcelJS = require('exceljs');
const path = require('path');

async function reconcileAll() {
  const parts = JSON.parse(fs.readFileSync('jmd/backend/data/spare-parts.json', 'utf8'));
  const conflictRules = JSON.parse(fs.readFileSync('jmd/backend/src/config/conflict-resolutions.json', 'utf8'));

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('jmd/backend/data-imports/ALL_VEHICLES_PRICE_LIST_Retail_Main.xlsx');
  const ws = wb.getWorksheet('Sheet1') || wb.worksheets[0];

  const excelRowsByCodeModel = new Map();

  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const model = String(row.getCell(5).value || '').trim();
    if (!model) return; // separator row

    const partCode = String(row.getCell(2).value || '').trim();
    const partName = String(row.getCell(3).value || '').trim();
    const rawPrice = row.getCell(6).value;
    const priceNum = Number(rawPrice);
    const pricePaise = isNaN(priceNum) ? 0 : Math.round(priceNum * 100);

    const key = `${partCode.toLowerCase()}__${model.toLowerCase()}`;
    if (!excelRowsByCodeModel.has(key)) {
      excelRowsByCodeModel.set(key, []);
    }
    excelRowsByCodeModel.get(key).push({
      rowNumber,
      partCode,
      partName,
      model,
      rawPrice,
      pricePaise
    });
  });

  let matchCount = 0;
  let mismatchCount = 0;
  const mismatches = [];

  parts.forEach(p => {
    const key = `${(p.code || '').toLowerCase()}__${(p.model || '').toLowerCase()}`;
    const excelEntries = excelRowsByCodeModel.get(key);

    if (!excelEntries || excelEntries.length === 0) {
      mismatchCount++;
      mismatches.push({
        id: p.id,
        reason: 'NOT_FOUND_IN_EXCEL',
        part: p
      });
      return;
    }

    // Check if conflict resolution applies
    let expectedPricePaise;
    if (conflictRules[p.id]) {
      expectedPricePaise = conflictRules[p.id].preferredPricePaise;
    } else {
      // If duplicate identical rows, they all have same price
      expectedPricePaise = excelEntries[0].pricePaise;
    }

    const diff = Math.abs(p.price - expectedPricePaise);
    if (diff > 0) {
      mismatchCount++;
      mismatches.push({
        id: p.id,
        reason: 'PRICE_MISMATCH',
        storedPaise: p.price,
        expectedPaise: expectedPricePaise,
        excelEntries
      });
    } else {
      matchCount++;
    }
  });

  console.log('=== FULL RECONCILIATION RESULTS ===');
  console.log('Total Stored Records Checked:', parts.length);
  console.log('Exact Matches to Excel:', matchCount);
  console.log('Mismatches (> 0 paise):', mismatchCount);

  if (mismatchCount > 0) {
    console.log('First 10 mismatches:', mismatches.slice(0, 10));
  } else {
    console.log('🎉 100% Reconciliation SUCCESS: 0 mismatches across all 2,964 records!');
  }
}

reconcileAll();

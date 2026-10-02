const fs = require('fs');
const ExcelJS = require('exceljs');

async function check() {
  const parts = JSON.parse(fs.readFileSync('jmd/backend/data/spare-parts.json', 'utf8'));
  const targetIds = [
    'VSP-V48-006__v48-2022',
    'VSP-V48-007__v48-2022',
    'BPLGR00169__magnus-pro',
    'BPLGR00170__magnus-pro'
  ];

  console.log('=== STORED IN spare-parts.json ===');
  targetIds.forEach(id => {
    const p = parts.find(x => x.id === id);
    console.log(id, '=>', p ? {
      id: p.id,
      name: p.name,
      model: p.model,
      pricePaise: p.price,
      priceRupees: p.price ? p.price / 100 : 0,
      flags: {
        flagged: p.flagged,
        conflict: p.conflict,
        needsVerification: p.needsVerification,
        verificationNote: p.verificationNote,
        flagDetails: p.flagDetails
      }
    } : 'NOT FOUND');
  });

  console.log('\n=== DIRECTLY FROM EXCEL ===');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile('jmd/backend/data-imports/ALL_VEHICLES_PRICE_LIST_Retail_Main.xlsx');
  const ws = wb.getWorksheet('Sheet1') || wb.worksheets[0];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const partCode = String(row.getCell(2).value || '').trim();
    const partName = String(row.getCell(3).value || '').trim();
    const model = String(row.getCell(5).value || '').trim();
    const price = row.getCell(6).value;

    const targets = ['VSP-V48-006', 'VSP-V48-007', 'BPLGR00169', 'BPLGR00170'];
    if (targets.includes(partCode)) {
      console.log(`Row ${rowNumber}: Code=${partCode} Name="${partName}" Model="${model}" Price=${price}`);
    }
  });
}

check();

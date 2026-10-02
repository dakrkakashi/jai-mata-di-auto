/**
 * Storage Service
 * Provides safe atomic JSON operations, corruption protection, and spare parts catalog operations.
 */

const fs = require('fs');
const path = require('path');
const { DATA_DIR } = require('../config');

function getFilePath(filename) {
  return path.join(DATA_DIR, filename);
}

/**
 * Resilient readJSON:
 * Returns defaultVal if file does not exist.
 * Logs critical error and throws if file is corrupt, preserving the corrupt file untouched on disk.
 */
function readJSON(filename, defaultVal = {}) {
  const file = getFilePath(filename);
  if (!fs.existsSync(file)) return defaultVal;
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.error(`🚨 CRITICAL DATA INTEGRITY ERROR: Corrupt JSON file detected at ${file}: ${err.message}. Preserving file untouched.`);
    throw new Error(`Data file corrupted: ${filename}`);
  }
}

/**
 * Atomic writeJSON:
 * Writes to a temporary file in the same directory and atomically renames it.
 */
function writeJSON(filename, data) {
  const file = getFilePath(filename);
  const dir = path.dirname(file);
  fs.mkdirSync(dir, { recursive: true });

  const tempFile = `${file}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
  try {
    fs.renameSync(tempFile, file);
  } catch (err) {
    // Windows rename fallback for locked files
    if (err.code === 'EPERM' || err.code === 'EACCES') {
      fs.copyFileSync(tempFile, file);
      try { fs.unlinkSync(tempFile); } catch {}
    } else {
      throw err;
    }
  }
}

/**
 * Log activity helper
 */
function logActivity(action, details = {}) {
  try {
    const list = readJSON('activity.json', []);
    list.unshift({
      id: Date.now(),
      action,
      details,
      timestamp: new Date().toISOString()
    });
    if (list.length > 500) list.length = 500;
    writeJSON('activity.json', list);
  } catch (e) {
    console.warn('Failed to log activity:', e.message);
  }
}

// ── Spare Parts Operations ───────────────────────────────────

function getSpareParts() {
  const parts = readJSON('spare-parts.json', []);
  const internalFlags = readJSON('spare-parts-internal.json', {});
  return parts.map(p => {
    const flags = internalFlags[p.id] || {};
    return {
      ...p,
      flagged: flags.flagged || false,
      conflict: flags.conflict || false,
      flagDetails: flags.flagDetails || '',
      verificationNote: flags.verificationNote || '',
      holdNote: flags.holdNote || ''
    };
  });
}

function formatIndianCurrency(paise) {
  if (paise == null || isNaN(paise) || Number(paise) <= 0) return 'Price on request';
  const rupees = Number(paise) / 100;
  const hasDecimals = (Number(paise) % 100) !== 0;
  const parts = rupees.toFixed(hasDecimals ? 2 : 0).split('.');
  let intPart = parts[0];
  const decPart = parts[1];

  // Indian comma grouping (e.g. 1,00,052)
  const lastThree = intPart.substring(intPart.length - 3);
  const otherNumbers = intPart.substring(0, intPart.length - 3);
  if (otherNumbers !== '') {
    intPart = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + lastThree;
  }
  return '₹' + intPart + (decPart ? '.' + decPart : '');
}

function saveSpareParts(parts) {
  const cleanParts = [];
  const internalFlags = {};

  parts.forEach(p => {
    const { flagged, conflict, flagDetails, verificationNote, note, holdNote, noCode, rowNumber, ...clean } = p;
    cleanParts.push(clean);
    const resolvedNote = verificationNote || note || '';
    if (flagged || conflict || flagDetails || resolvedNote || holdNote) {
      internalFlags[p.id] = {
        flagged: !!flagged,
        conflict: !!conflict,
        flagDetails: flagDetails || '',
        verificationNote: resolvedNote,
        holdNote: holdNote || ''
      };
    }
  });

  writeJSON('spare-parts.json', cleanParts);
  writeJSON('spare-parts-internal.json', internalFlags);
}

/**
 * Query spare parts with search, filtering, and pagination.
 * Serializes strictly for public consumption (held records omit price; internal flags excluded).
 */
function querySpareParts({ q, category, model, page = 1, limit = 20, sort = '' }) {
  const parts = getSpareParts();
  let filtered = parts;

  if (q && q.trim()) {
    const search = q.trim().toLowerCase();
    filtered = filtered.filter(p =>
      (p.name && p.name.toLowerCase().includes(search)) ||
      (p.code && p.code.toLowerCase().includes(search)) ||
      (p.model && p.model.toLowerCase().includes(search)) ||
      (p.description && p.description.toLowerCase().includes(search)) ||
      (Array.isArray(p.aliases) && p.aliases.some(a => a.toLowerCase().includes(search)))
    );
  }

  if (category && category !== 'All') {
    filtered = filtered.filter(p => p.category && p.category.toLowerCase() === category.toLowerCase());
  }

  if (model && model !== 'All') {
    const mLower = model.toLowerCase();
    filtered = filtered.filter(p =>
      (p.model && p.model.toLowerCase() === mLower) ||
      (p.modelSlug && p.modelSlug.toLowerCase() === mLower)
    );
  }

  if (sort) {
    const [field, dir] = String(sort).split('-');
    filtered = [...filtered];
    if (field === 'price') {
      filtered.sort((a, b) => dir === 'desc' ? ((b.price || 0) - (a.price || 0)) : ((a.price || 0) - (b.price || 0)));
    } else {
      filtered.sort((a, b) => {
        const va = (a.name || '').toLowerCase();
        const vb = (b.name || '').toLowerCase();
        return dir === 'desc' ? (vb.localeCompare(va)) : (va.localeCompare(vb));
      });
    }
  }

  const total = filtered.length;
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const totalPages = Math.ceil(total / l) || 1;
  const start = (p - 1) * l;
  const rawData = filtered.slice(start, start + l);

  // Safe public serializer
  const data = rawData.map(item => {
    const base = {
      id: String(item.id),
      name: item.name,
      code: item.code,
      category: item.category,
      model: item.model,
      modelSlug: item.modelSlug,
      stock: item.stock !== undefined ? item.stock : null,
      featured: item.featured || 'false',
      description: item.description || '',
      image: item.image || '',
      needsVerification: Boolean(item.needsVerification),
      aliases: item.aliases || []
    };

    if (item.needsVerification) {
      // Held records: strictly omit price, priceRupees, and priceFormatted
      return {
        ...base,
        priceOnRequest: true
      };
    }

    return {
      ...base,
      price: item.price,
      priceRupees: item.price ? item.price / 100 : 0,
      priceFormatted: formatIndianCurrency(item.price),
      priceOnRequest: Boolean(item.priceOnRequest || !item.price || item.price <= 0)
    };
  });

  return {
    total,
    page: p,
    limit: l,
    totalPages,
    data
  };
}

function updateSparePart(id, field, value) {
  const parts = getSpareParts();
  const part = parts.find(p => String(p.id) === String(id));
  if (!part) return null;

  if (field === 'price') {
    // Admin passes rupee value with decimals (e.g. 331.25)
    const valNum = Number(value);
    const paise = isNaN(valNum) || valNum <= 0 ? 0 : Math.round(valNum * 100);
    part.price = paise;
    part.priceOnRequest = (paise <= 0);
  } else if (field === 'stock') {
    part.stock = (value === '' || value === null || isNaN(Number(value))) ? null : Number(value);
  } else if (field === 'needsVerification' || field === 'flagged' || field === 'conflict') {
    part[field] = Boolean(value);
  } else {
    part[field] = value;
  }
  saveSpareParts(parts);
  return part;
}

function saveSparePartFull(id, updates) {
  const parts = getSpareParts();
  const index = parts.findIndex(p => String(p.id) === String(id));
  if (index === -1) return null;

  let newPrice = parts[index].price;
  if (updates.price !== undefined) {
    const valNum = Number(updates.price);
    newPrice = isNaN(valNum) || valNum <= 0 ? 0 : Math.round(valNum * 100);
  } else if (updates.pricePaise !== undefined) {
    newPrice = Number(updates.pricePaise) || 0;
  }

  let newStock = parts[index].stock;
  if (updates.stock !== undefined) {
    newStock = (updates.stock === '' || updates.stock === null || isNaN(Number(updates.stock))) ? null : Number(updates.stock);
  }

  parts[index] = {
    ...parts[index],
    ...updates,
    id: String(parts[index].id),
    price: newPrice,
    priceOnRequest: (newPrice <= 0),
    stock: newStock
  };
  saveSpareParts(parts);
  return parts[index];
}

function clearSparePartFlag(id) {
  const parts = getSpareParts();
  const part = parts.find(p => String(p.id) === String(id));
  if (!part) return null;

  part.needsVerification = false;
  part.flagged = false;
  part.conflict = false;
  part.flagDetails = '';
  saveSpareParts(parts);
  return part;
}

function deleteSparePart(id) {
  let parts = getSpareParts();
  const initialLen = parts.length;
  parts = parts.filter(p => String(p.id) !== String(id));
  if (parts.length === initialLen) return false;
  saveSpareParts(parts);
  return true;
}

function addSparePart(newPartData) {
  const parts = getSpareParts();
  const code = String(newPartData.code || '').trim();
  const model = String(newPartData.model || 'Nexus').trim();
  const modelSlug = model.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const id = code ? `${code}__${modelSlug}` : `NOCODE-${modelSlug}-${Date.now()}`;
  const priceRupees = Number(newPartData.price) || 0;
  const pricePaise = Math.round(priceRupees * 100);

  const newPart = {
    id,
    name: String(newPartData.name || '').trim(),
    code,
    category: String(newPartData.category || 'General').trim(),
    model,
    modelSlug,
    price: pricePaise,
    priceOnRequest: (pricePaise <= 0),
    stock: (newPartData.stock === '' || newPartData.stock === null || isNaN(Number(newPartData.stock))) ? null : Number(newPartData.stock),
    featured: String(newPartData.featured || 'false'),
    description: String(newPartData.description || '').trim(),
    image: newPartData.image || `/images/parts/${String(code || 'default').toLowerCase()}.jpg`,
    needsVerification: false,
    flagged: false,
    conflict: false
  };
  parts.push(newPart);
  saveSpareParts(parts);
  return newPart;
}

module.exports = {
  readJSON,
  writeJSON,
  logActivity,
  getSpareParts,
  saveSpareParts,
  querySpareParts,
  updateSparePart,
  saveSparePartFull,
  clearSparePartFlag,
  deleteSparePart,
  addSparePart,
  formatIndianCurrency
};

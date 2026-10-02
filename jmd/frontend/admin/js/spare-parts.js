/* ─── Spare Parts Management Module for Admin Panel ─── */

let allParts = [];
let filteredParts = [];
let currentPage = 1;
let pageSize = 50;

async function loadSpareParts() {
  const tbody = document.getElementById('spareparts-tbody');
  if (tbody) {
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 8;
    loadingCell.className = 'text-center p-10 color-muted';
    loadingCell.textContent = 'Loading spare parts catalog…';
    loadingRow.appendChild(loadingCell);
    tbody.replaceChildren(loadingRow);
  }

  try {
    const [partsRes, metaRes] = await Promise.allSettled([
      API.get('/api/admin/spare-parts'),
      API.get('/api/admin/price-list-meta')
    ]);

    if (partsRes.status === 'fulfilled') {
      const data = partsRes.value;
      allParts = Array.isArray(data) ? data : (data.parts || []);
    } else {
      throw partsRes.reason;
    }

    if (metaRes.status === 'fulfilled' && metaRes.value) {
      renderPriceListMeta(metaRes.value);
    }

    populateFilterDropdowns();
    updateStatsCards();
    filterSpareParts();
  } catch (err) {
    console.error('Failed to load spare parts:', err);
    if (tbody) {
      const errRow = document.createElement('tr');
      const errCell = document.createElement('td');
      errCell.colSpan = 8;
      errCell.className = 'text-center p-10 text-danger';
      errCell.textContent = 'Failed to load catalog. Please retry.';
      errRow.appendChild(errCell);
      tbody.replaceChildren(errRow);
    }
    toast('Error loading spare parts: ' + err.message, 'error');
  }
}

function renderPriceListMeta(meta) {
  const metaInfo = document.getElementById('pl-meta-info');
  const metaDate = document.getElementById('pl-meta-date');
  const badgeRec = document.getElementById('pl-badge-records');
  const badgeFlag = document.getElementById('pl-badge-flagged');
  const badgeHold = document.getElementById('pl-badge-hold');

  const sha = meta.sourceSha256 || meta.sha256 || '';
  const timestamp = meta.importedAt || meta.importTimestamp;
  const recordCount = (meta.counts && meta.counts.activeCatalogItems) || meta.recordCount || allParts.length;

  if (metaInfo) {
    const hash = sha ? `${sha.substring(0, 10)}…` : '';
    metaInfo.textContent = `Price list: ${meta.sourceFile || 'ALL_VEHICLES_PRICE_LIST_Retail_Main.xlsx'} ${hash ? '(' + hash + ')' : ''}`;
  }
  if (metaDate && timestamp) {
    const d = new Date(timestamp);
    metaDate.textContent = `Imported on ${d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`;
  }
  if (badgeRec) {
    badgeRec.textContent = `${recordCount.toLocaleString()} Records`;
  }

  const flaggedCount = allParts.filter(p => p.flagged || p.conflict || p.needsVerification).length;
  const holdCount = allParts.filter(p => p.needsVerification).length;

  if (badgeFlag) {
    badgeFlag.textContent = `⚠️ ${flaggedCount} Flagged`;
  }
  if (badgeHold) {
    badgeHold.textContent = `🛑 ${holdCount} On Hold`;
  }
}

function updateStatsCards() {
  const totalCountEl = document.getElementById('stat-total-parts');
  const inStockEl = document.getElementById('stat-in-stock');
  const outOfStockEl = document.getElementById('stat-out-stock');

  const total = allParts.length;
  const inStock = allParts.filter(p => p.stock !== null && p.stock !== undefined && parseInt(p.stock, 10) > 0).length;
  const outOfStock = allParts.filter(p => p.stock !== null && p.stock !== undefined && parseInt(p.stock, 10) === 0).length;

  if (totalCountEl) totalCountEl.textContent = total.toLocaleString();
  if (inStockEl) inStockEl.textContent = inStock.toLocaleString();
  if (outOfStockEl) outOfStockEl.textContent = outOfStock.toLocaleString();
}

function populateFilterDropdowns() {
  const catSelect = document.getElementById('sp-category-filter');
  const modelSelect = document.getElementById('sp-model-filter');

  if (catSelect && catSelect.children.length <= 1) {
    const categories = Array.from(new Set(allParts.map(p => p.category).filter(Boolean))).sort();
    categories.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      catSelect.appendChild(opt);
    });
  }

  if (modelSelect && modelSelect.children.length <= 1) {
    const models = Array.from(new Set(allParts.map(p => p.model).filter(Boolean))).sort();
    models.forEach(mod => {
      const opt = document.createElement('option');
      opt.value = mod;
      opt.textContent = mod;
      modelSelect.appendChild(opt);
    });
  }
}

function filterByFlag(flagType) {
  const flagSelect = document.getElementById('sp-flag-filter');
  if (flagSelect) {
    flagSelect.value = flagType;
    filterSpareParts();
  }
}

function filterSpareParts() {
  const query = (document.getElementById('sp-search')?.value || '').toLowerCase().trim();
  const selectedCat = document.getElementById('sp-category-filter')?.value || '';
  const selectedModel = document.getElementById('sp-model-filter')?.value || '';
  const stockFilter = document.getElementById('sp-stock-filter')?.value || 'all';
  const flagFilter = document.getElementById('sp-flag-filter')?.value || 'all';

  filteredParts = allParts.filter(p => {
    const matchQuery = !query || 
      (p.name && p.name.toLowerCase().includes(query)) ||
      (p.code && p.code.toLowerCase().includes(query)) ||
      (p.id && String(p.id).toLowerCase().includes(query));

    const matchCat = !selectedCat || p.category === selectedCat;
    const matchModel = !selectedModel || p.model === selectedModel;

    let matchStock = true;
    if (stockFilter === 'in_stock') {
      matchStock = p.stock !== null && p.stock !== undefined && parseInt(p.stock, 10) > 0;
    } else if (stockFilter === 'out_of_stock') {
      matchStock = p.stock !== null && p.stock !== undefined && parseInt(p.stock, 10) === 0;
    } else if (stockFilter === 'low_stock') {
      const s = parseInt(p.stock, 10) || 0;
      matchStock = p.stock !== null && p.stock !== undefined && s > 0 && s <= 5;
    } else if (stockFilter === 'enquire') {
      matchStock = p.stock === null || p.stock === undefined;
    }

    let matchFlag = true;
    if (flagFilter === 'flagged') {
      matchFlag = !!(p.flagged || p.conflict || p.needsVerification);
    } else if (flagFilter === 'hold') {
      matchFlag = !!p.needsVerification;
    } else if (flagFilter === 'conflict') {
      matchFlag = !!p.conflict;
    } else if (flagFilter === 'price_on_request') {
      matchFlag = !p.price || p.price === 0;
    }

    return matchQuery && matchCat && matchModel && matchStock && matchFlag;
  });

  currentPage = 1;
  renderSparePartsTable();
}

function renderSparePartsTable() {
  const tbody = document.getElementById('spareparts-tbody');
  const countEl = document.getElementById('parts-count');
  const paginationEl = document.getElementById('parts-pagination');
  if (!tbody) return;

  const total = filteredParts.length;
  if (countEl) {
    countEl.textContent = `Showing ${total === 0 ? 0 : Math.min(total, (currentPage - 1) * pageSize + 1)}–${Math.min(total, currentPage * pageSize)} of ${total} parts (${allParts.length} total)`;
  }

  tbody.replaceChildren();

  if (total === 0) {
    const emptyRow = document.createElement('tr');
    const emptyCell = document.createElement('td');
    emptyCell.colSpan = 8;
    emptyCell.className = 'text-center p-10 color-muted';
    emptyCell.textContent = 'No spare parts match your filters.';
    emptyRow.appendChild(emptyCell);
    tbody.appendChild(emptyRow);
    if (paginationEl) paginationEl.replaceChildren();
    return;
  }

  const totalPages = Math.ceil(total / pageSize);
  const start = (currentPage - 1) * pageSize;
  const pageItems = filteredParts.slice(start, start + pageSize);

  pageItems.forEach(p => {
    const stockVal = p.stock !== null && p.stock !== undefined ? parseInt(p.stock, 10) : null;
    const pricePaise = parseInt(p.price, 10) || 0;
    const priceRupees = (pricePaise / 100).toFixed(2);

    const tr = document.createElement('tr');

    // ID
    const tdId = document.createElement('td');
    const codeId = document.createElement('code');
    codeId.textContent = `#${p.id}`;
    tdId.appendChild(codeId);
    tr.appendChild(tdId);

    // Name + Flags
    const tdName = document.createElement('td');
    const strongName = document.createElement('strong');
    strongName.textContent = p.name || '—';
    tdName.appendChild(strongName);

    if (p.needsVerification) {
      const holdBadge = document.createElement('span');
      holdBadge.className = 'badge badge-danger ml-8';
      holdBadge.style.cssText = 'margin-left:6px;font-size:10px;vertical-align:middle;';
      holdBadge.title = p.verificationNote || 'On Hold: Price requires owner verification before cart checkout';
      holdBadge.textContent = '🛑 HOLD';
      tdName.appendChild(holdBadge);
    } else if (p.conflict) {
      const confBadge = document.createElement('span');
      confBadge.className = 'badge badge-warning ml-8';
      confBadge.style.cssText = 'margin-left:6px;font-size:10px;vertical-align:middle;';
      confBadge.title = p.verificationNote || 'Resolved price conflict';
      confBadge.textContent = '⚡ Conflict';
      tdName.appendChild(confBadge);
    } else if (p.flagged) {
      const flagBadge = document.createElement('span');
      flagBadge.className = 'badge badge-warning ml-8';
      flagBadge.style.cssText = 'margin-left:6px;font-size:10px;vertical-align:middle;';
      flagBadge.title = p.verificationNote || 'Flagged for review';
      flagBadge.textContent = '⚠️ Verify';
      tdName.appendChild(flagBadge);
    }

    tr.appendChild(tdName);

    // Code
    const tdCode = document.createElement('td');
    const codeEl = document.createElement('code');
    codeEl.textContent = p.code || '—';
    tdCode.appendChild(codeEl);
    tr.appendChild(tdCode);

    // Category
    const tdCat = document.createElement('td');
    const catBadge = document.createElement('span');
    catBadge.className = 'badge badge-secondary';
    catBadge.textContent = p.category || 'General';
    tdCat.appendChild(catBadge);
    tr.appendChild(tdCat);

    // Model
    const tdModel = document.createElement('td');
    const modelBadge = document.createElement('span');
    modelBadge.className = 'badge badge-info';
    modelBadge.textContent = p.model || 'Universal';
    tdModel.appendChild(modelBadge);
    tr.appendChild(tdModel);

    // Price (Editable with 2-decimal paise precision)
    const tdPrice = document.createElement('td');
    const priceWrap = document.createElement('div');
    priceWrap.style.cssText = 'display:flex;align-items:center;gap:4px;';
    const currSpan = document.createElement('span');
    currSpan.textContent = '₹';
    const priceInput = document.createElement('input');
    priceInput.type = 'number';
    priceInput.min = '0';
    priceInput.step = '0.01';
    priceInput.className = 'form-input-sm';
    priceInput.style.cssText = 'width:88px;padding:4px 6px;text-align:right;';
    priceInput.value = priceRupees;
    priceInput.title = `Paise: ${pricePaise}`;
    priceInput.onchange = () => updatePartField(p.id, 'price', parseFloat(priceInput.value));
    priceWrap.append(currSpan, priceInput);
    tdPrice.appendChild(priceWrap);
    tr.appendChild(tdPrice);

    // Stock
    const tdStock = document.createElement('td');
    const stockWrap = document.createElement('div');
    stockWrap.style.cssText = 'display:flex;align-items:center;gap:6px;';
    const stockInput = document.createElement('input');
    stockInput.type = 'number';
    stockInput.min = '0';
    stockInput.step = '1';
    stockInput.className = 'form-input-sm';
    stockInput.style.cssText = 'width:65px;padding:4px 6px;';
    stockInput.placeholder = 'Enquire';
    stockInput.value = stockVal !== null ? stockVal : '';
    stockInput.onchange = () => {
      const val = stockInput.value.trim() === '' ? null : parseInt(stockInput.value, 10);
      updatePartField(p.id, 'stock', val);
    };

    const stockBadge = document.createElement('span');
    if (stockVal === null) {
      stockBadge.className = 'badge badge-secondary';
      stockBadge.style.fontSize = '10px';
      stockBadge.textContent = 'Enquire';
    } else {
      stockBadge.className = `badge ${stockVal === 0 ? 'badge-danger' : (stockVal <= 5 ? 'badge-warning' : 'badge-success')}`;
      stockBadge.style.fontSize = '10px';
      stockBadge.textContent = stockVal === 0 ? 'Out' : (stockVal <= 5 ? 'Low' : 'OK');
    }

    stockWrap.append(stockInput, stockBadge);
    tdStock.appendChild(stockWrap);
    tr.appendChild(tdStock);

    // Actions
    const tdActions = document.createElement('td');
    const actionsWrap = document.createElement('div');
    actionsWrap.style.cssText = 'display:flex;gap:4px;align-items:center;';

    const editBtn = document.createElement('button');
    editBtn.className = 'btn btn-sm btn-secondary';
    editBtn.title = 'Edit Part';
    editBtn.textContent = '✏️';
    editBtn.onclick = () => openEditPartModal(p.id);

    const delBtn = document.createElement('button');
    delBtn.className = 'btn btn-sm btn-danger';
    delBtn.title = 'Delete Part';
    delBtn.textContent = '🗑️';
    delBtn.onclick = () => deletePart(p.id);

    actionsWrap.append(editBtn, delBtn);

    // One-click clear flag button if flagged
    if (p.flagged || p.conflict || p.needsVerification) {
      const clearBtn = document.createElement('button');
      clearBtn.className = 'btn btn-sm btn-success';
      clearBtn.title = 'Clear verification flag (Publish at current price)';
      clearBtn.textContent = '✓ Clear';
      clearBtn.onclick = () => clearPartFlag(p.id);
      actionsWrap.append(clearBtn);
    }

    tdActions.appendChild(actionsWrap);
    tr.appendChild(tdActions);

    tbody.appendChild(tr);
  });

  renderPagination(totalPages);
}

function renderPagination(totalPages) {
  const el = document.getElementById('parts-pagination');
  if (!el) return;
  el.replaceChildren();
  if (totalPages <= 1) return;

  const wrap = document.createElement('div');
  wrap.style.cssText = 'display:flex;align-items:center;gap:8px;';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'btn btn-sm btn-secondary';
  prevBtn.textContent = '← Prev';
  prevBtn.disabled = currentPage <= 1;
  prevBtn.onclick = () => goToPage(currentPage - 1);

  const infoSpan = document.createElement('span');
  infoSpan.style.cssText = 'font-size:13px;color:#94a3b8;';
  infoSpan.append('Page ');
  const curStrong = document.createElement('strong');
  curStrong.textContent = String(currentPage);
  infoSpan.append(curStrong);
  infoSpan.append(' of ');
  const totalStrong = document.createElement('strong');
  totalStrong.textContent = String(totalPages);
  infoSpan.append(totalStrong);

  const nextBtn = document.createElement('button');
  nextBtn.className = 'btn btn-sm btn-secondary';
  nextBtn.textContent = 'Next →';
  nextBtn.disabled = currentPage >= totalPages;
  nextBtn.onclick = () => goToPage(currentPage + 1);

  wrap.append(prevBtn, infoSpan, nextBtn);
  el.appendChild(wrap);
}

function goToPage(page) {
  const totalPages = Math.ceil(filteredParts.length / pageSize);
  if (page < 1 || page > totalPages) return;
  currentPage = page;
  renderSparePartsTable();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function changePageSize(newSize) {
  pageSize = parseInt(newSize, 10) || 50;
  currentPage = 1;
  renderSparePartsTable();
}

async function updatePartField(id, field, value) {
  try {
    const res = await API.post('/api/admin/spare-parts/update', { id, field, value });
    if (res && res.success) {
      toast(`${field === 'stock' ? 'Stock' : 'Price'} updated`, 'success', 1500);
      const target = allParts.find(p => String(p.id) === String(id));
      if (target) {
        if (field === 'price') {
          target.price = Math.round(parseFloat(value) * 100);
        } else {
          target[field] = value;
        }
      }
      updateStatsCards();
    } else {
      toast('Update failed: ' + (res?.error || 'Unknown error'), 'error');
      loadSpareParts();
    }
  } catch (err) {
    toast('Error updating: ' + err.message, 'error');
    loadSpareParts();
  }
}

async function clearPartFlag(id) {
  try {
    const res = await API.post('/api/admin/spare-parts/clear-flag', { id });
    if (res && res.success) {
      toast('Verification flag cleared', 'success', 2000);
      const target = allParts.find(p => String(p.id) === String(id));
      if (target) {
        target.flagged = false;
        target.conflict = false;
        target.needsVerification = false;
        delete target.verificationNote;
      }
      // Refresh meta badges
      renderPriceListMeta({});
      filterSpareParts();
    } else {
      toast('Failed to clear flag: ' + (res?.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    toast('Error clearing flag: ' + err.message, 'error');
  }
}

function openAddPartModal() {
  document.getElementById('add-part-form')?.reset();
  const modal = document.getElementById('add-part-modal');
  if (modal) modal.classList.add('open');
}

async function submitAddPart(e) {
  if (e) e.preventDefault();
  const name = document.getElementById('add-sp-name')?.value?.trim();
  const code = document.getElementById('add-sp-code')?.value?.trim();
  const category = document.getElementById('add-sp-category')?.value?.trim() || 'General';
  const model = document.getElementById('add-sp-model')?.value?.trim() || 'Nexus';
  const price = parseFloat(document.getElementById('add-sp-price')?.value) || 0;
  const stockVal = document.getElementById('add-sp-stock')?.value?.trim();
  const stock = stockVal === '' ? null : (parseInt(stockVal, 10) || 0);

  if (!name || !code) {
    toast('Name and Part Code are required', 'error');
    return;
  }

  try {
    const res = await API.post('/api/admin/spare-parts/add', {
      name, code, category, model, price, stock
    });
    if (res && res.success) {
      toast('Part added successfully', 'success', 2000);
      closeModal('add-part-modal');
      await loadSpareParts();
    } else {
      toast('Add part failed: ' + (res?.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

function openEditPartModal(id) {
  const part = allParts.find(p => String(p.id) === String(id));
  if (!part) return;

  const pricePaise = parseInt(part.price, 10) || 0;
  const priceRupees = (pricePaise / 100).toFixed(2);

  document.getElementById('edit-sp-id').value = part.id;
  document.getElementById('edit-sp-name').value = part.name || '';
  document.getElementById('edit-sp-code').value = part.code || '';
  document.getElementById('edit-sp-category').value = part.category || 'General';
  document.getElementById('edit-sp-model').value = part.model || 'Universal';
  document.getElementById('edit-sp-price').value = priceRupees;
  document.getElementById('edit-sp-stock').value = (part.stock !== null && part.stock !== undefined) ? part.stock : '';

  const modal = document.getElementById('edit-part-modal');
  if (modal) modal.classList.add('open');
}

async function submitSavePart(e) {
  if (e) e.preventDefault();
  const id = document.getElementById('edit-sp-id')?.value;
  if (!id) return;

  const stockVal = document.getElementById('edit-sp-stock')?.value?.trim();
  const updates = {
    name: document.getElementById('edit-sp-name')?.value?.trim(),
    code: document.getElementById('edit-sp-code')?.value?.trim(),
    category: document.getElementById('edit-sp-category')?.value?.trim(),
    model: document.getElementById('edit-sp-model')?.value?.trim(),
    price: parseFloat(document.getElementById('edit-sp-price')?.value) || 0,
    stock: stockVal === '' ? null : (parseInt(stockVal, 10) || 0)
  };

  try {
    const res = await API.post('/api/admin/spare-parts/save', { id, updates });
    if (res && res.success) {
      toast('Part changes saved', 'success', 2000);
      closeModal('edit-part-modal');
      const target = allParts.find(p => String(p.id) === String(id));
      if (target) {
        target.name = updates.name;
        target.code = updates.code;
        target.category = updates.category;
        target.model = updates.model;
        target.price = Math.round(updates.price * 100);
        target.stock = updates.stock;
      }
      filterSpareParts();
      updateStatsCards();
    } else {
      toast('Save failed: ' + (res?.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

async function deletePart(id) {
  const part = allParts.find(p => String(p.id) === String(id));
  const name = part ? `"${part.name}"` : `part #${id}`;
  if (!confirm(`Are you sure you want to delete ${name}?`)) return;

  try {
    const res = await API.post('/api/admin/spare-parts/delete', { id });
    if (res && res.success) {
      toast('Part deleted', 'success', 2000);
      allParts = allParts.filter(p => String(p.id) !== String(id));
      filterSpareParts();
      updateStatsCards();
    } else {
      toast('Delete failed: ' + (res?.error || 'Unknown error'), 'error');
    }
  } catch (err) {
    toast('Error: ' + err.message, 'error');
  }
}

function exportSparePartsCSV() {
  if (!filteredParts.length) {
    toast('No parts to export', 'error');
    return;
  }
  const headers = ['ID', 'Name', 'Code', 'Category', 'Model', 'Price (INR)', 'Stock', 'Verification Status'];
  const rows = filteredParts.map(p => {
    const priceRupees = ((parseInt(p.price, 10) || 0) / 100).toFixed(2);
    const stockStr = (p.stock !== null && p.stock !== undefined) ? p.stock : 'Enquire';
    const status = p.needsVerification ? 'HOLD' : (p.conflict ? 'CONFLICT' : (p.flagged ? 'FLAGGED' : 'NORMAL'));
    return [
      `"${p.id}"`,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${(p.code || '').replace(/"/g, '""')}"`,
      `"${(p.category || '').replace(/"/g, '""')}"`,
      `"${(p.model || '').replace(/"/g, '""')}"`,
      priceRupees,
      stockStr,
      status
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `jmd-spare-parts-${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

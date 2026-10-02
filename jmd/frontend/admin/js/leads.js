/* ─── Leads CRM Module ─── */
'use strict';

let allLeads = [];
let leadsPage = 1;
const PAGE_SIZE = 20;
let leadFilter = 'all';
let leadSearch = '';
let currentLeadId = null;
let selectedLeadIds = [];

// Helper fallback if dom-utils not loaded
const domEl = (typeof window !== 'undefined' && window.el) ? window.el : function(tag, attrs, ...children) {
  const elem = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (k === 'className' || k === 'class') elem.className = v;
      else if (k === 'style') {
        if (typeof v === 'object') Object.assign(elem.style, v);
        else elem.style.cssText = v;
      } else if (k.startsWith('on') && typeof v === 'function') {
        elem.addEventListener(k.slice(2).toLowerCase(), v);
      } else if (k === 'checked' || k === 'disabled' || k === 'selected') {
        elem[k] = Boolean(v);
        if (v) elem.setAttribute(k, '');
      } else {
        elem.setAttribute(k, v);
      }
    }
  }
  children.flat().forEach(c => {
    if (c === null || c === undefined) return;
    if (c instanceof Node) elem.appendChild(c);
    else elem.appendChild(document.createTextNode(String(c)));
  });
  return elem;
};

async function loadLeads() {
  try {
    const data = await API.get('/api/admin/leads');
    allLeads = data.leads || data || [];
    renderLeads();
    updateLeadCount();
    updateUnreadBadge();
  } catch (e) { Toast.error('Failed to load leads'); }
}

function getFilteredLeads() {
  let list = allLeads.filter(l => !l.archived);
  if (leadFilter !== 'all') list = list.filter(l => l.status === leadFilter);
  if (leadSearch) {
    const q = leadSearch.toLowerCase();
    list = list.filter(l => JSON.stringify(l).toLowerCase().includes(q));
  }
  return list;
}

function renderLeads() {
  const tbody = document.getElementById('leads-tbody');
  if (!tbody) return;
  const list = getFilteredLeads();
  const total = list.length;
  const pages = Math.ceil(total / PAGE_SIZE) || 1;
  if (leadsPage > pages) leadsPage = 1;
  const slice = list.slice((leadsPage - 1) * PAGE_SIZE, leadsPage * PAGE_SIZE);

  tbody.replaceChildren();

  if (!slice.length) {
    tbody.appendChild(
      domEl('tr', {},
        domEl('td', {
          colSpan: 8,
          className: 'text-center',
          style: 'padding:40px;color:var(--text3)'
        }, '📭 No leads found')
      )
    );
  } else {
    slice.forEach(l => {
      const isRead = Boolean(l.read);
      const isSelected = selectedLeadIds.includes(l.id);

      const tr = domEl('tr', { className: !isRead ? 'fw-600' : '' });

      // Checkbox
      const chk = domEl('input', {
        type: 'checkbox',
        className: 'lead-check',
        value: String(l.id),
        checked: isSelected,
        title: 'Select lead',
        'aria-label': `Select lead ${l.name || l.id}`,
        onclick: (e) => {
          e.stopPropagation();
          toggleLeadSelect(l.id);
        }
      });
      tr.appendChild(domEl('td', {}, chk));

      // Name & Star & Badge
      const nameBox = domEl('div', { style: 'display:flex;align-items:center;gap:8px' });
      if (l.starred) {
        nameBox.appendChild(domEl('span', {}, '⭐'));
      }
      const nameLink = domEl('span', {
        style: 'cursor:pointer;color:var(--accent)',
        onclick: () => openLead(l.id)
      }, l.name || '—');
      nameBox.appendChild(nameLink);

      if (!isRead) {
        nameBox.appendChild(domEl('span', { className: 'badge badge-unread', style: 'font-size:9px' }, 'NEW'));
      }
      tr.appendChild(domEl('td', {}, nameBox));

      // Phone
      const phoneClean = (l.phone || '').replace(/[^\d+]/g, '');
      const phoneLink = domEl('a', {
        href: phoneClean ? `tel:${phoneClean}` : '#',
        style: 'color:var(--text2)'
      }, l.phone || '—');
      tr.appendChild(domEl('td', {}, phoneLink));

      // Model
      tr.appendChild(domEl('td', {}, l.model || l.subject || '—'));

      // Source
      tr.appendChild(domEl('td', {}, l.source || 'Direct'));

      // Status selector
      const statusSelect = domEl('select', {
        style: 'background:var(--card2);border:1px solid var(--border);color:var(--text);padding:4px 6px;border-radius:4px;font-size:11px;outline:none',
        title: 'Lead status',
        'aria-label': `Lead status for ${l.name || l.id}`,
        onchange: (e) => quickUpdateLead(l.id, 'status', e.target.value)
      });
      ['new', 'contacted', 'quoted', 'converted', 'lost'].forEach(st => {
        const opt = domEl('option', { value: st }, st.charAt(0).toUpperCase() + st.slice(1));
        if (l.status === st) opt.selected = true;
        statusSelect.appendChild(opt);
      });
      tr.appendChild(domEl('td', {}, statusSelect));

      // Date
      const dateText = l.timestamp || l.time ? new Date(l.timestamp || l.time).toLocaleDateString('en-IN') : '—';
      tr.appendChild(domEl('td', { style: 'font-size:11px;color:var(--text3)' }, dateText));

      // Actions
      const actionsBox = domEl('div', { style: 'display:flex;gap:4px' });
      actionsBox.appendChild(domEl('button', {
        className: 'btn btn-sm btn-secondary',
        title: 'View',
        onclick: () => openLead(l.id)
      }, '👁'));
      actionsBox.appendChild(domEl('button', {
        className: 'btn btn-sm',
        style: 'background:rgba(34,197,94,0.2);color:var(--success);border:none',
        title: 'WhatsApp',
        onclick: () => whatsAppLead(l.id)
      }, '💬'));
      actionsBox.appendChild(domEl('button', {
        className: 'btn btn-sm btn-danger',
        title: 'Delete',
        onclick: () => deleteLead(l.id)
      }, '🗑'));
      tr.appendChild(domEl('td', {}, actionsBox));

      tbody.appendChild(tr);
    });
  }

  // Pagination
  renderLeadPagination(pages, total);
  const countEl = document.getElementById('leads-count');
  if (countEl) countEl.textContent = `${total} lead${total !== 1 ? 's' : ''}`;
}

function renderLeadPagination(pages, total) {
  const el = document.getElementById('leads-pagination');
  if (!el) return;
  el.replaceChildren();
  if (pages <= 1) return;

  for (let i = 1; i <= pages; i++) {
    const btn = domEl('button', {
      className: `page-btn ${i === leadsPage ? 'active' : ''}`,
      onclick: () => {
        leadsPage = i;
        renderLeads();
      }
    }, String(i));
    el.appendChild(btn);
  }
}

function updateLeadCount() {
  const unread = allLeads.filter(l => !l.read && !l.archived).length;
  const badge = document.getElementById('nav-leads-badge');
  const unreadEl = document.getElementById('stat-unread');
  if (badge) { badge.textContent = unread; badge.classList.toggle('hidden', !unread); }
  if (unreadEl) unreadEl.textContent = unread;
}

function updateUnreadBadge() {
  const unread = allLeads.filter(l => !l.read && !l.archived).length;
  const b = document.getElementById('unread-badge');
  if (b) { b.textContent = unread; b.classList.toggle('hidden', !unread); }
}

function setLeadFilter(element, status) {
  leadFilter = status;
  leadsPage = 1;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  element.classList.add('active');
  renderLeads();
}

function filterLeads() {
  leadSearch = document.getElementById('leads-search')?.value || '';
  leadsPage = 1;
  renderLeads();
}

function toggleSelectAll(cb) {
  const checks = document.querySelectorAll('.lead-check');
  checks.forEach(c => {
    c.checked = cb.checked;
    const id = parseInt(c.value, 10);
    if (cb.checked) { if (!selectedLeadIds.includes(id)) selectedLeadIds.push(id); }
    else { selectedLeadIds = selectedLeadIds.filter(x => x !== id); }
  });
  const bulk = document.getElementById('bulk-actions');
  if (bulk) bulk.classList.toggle('hidden', selectedLeadIds.length === 0);
}

function toggleLeadSelect(id) {
  if (selectedLeadIds.includes(id)) selectedLeadIds = selectedLeadIds.filter(x => x !== id);
  else selectedLeadIds.push(id);
  const bulk = document.getElementById('bulk-actions');
  if (bulk) bulk.classList.toggle('hidden', selectedLeadIds.length === 0);
}

async function openLead(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead) return;
  currentLeadId = id;

  if (!lead.read) {
    await quickUpdateLead(id, 'read', true);
    lead.read = true;
  }

  const modal = document.getElementById('lead-modal');
  const body = document.getElementById('lead-detail-body');
  const statusSel = document.getElementById('lead-status-select');
  if (statusSel) statusSel.value = lead.status || 'new';

  if (body) {
    body.replaceChildren();

    const container = domEl('div', { className: 'modal-body' });
    const grid = domEl('div', { style: 'display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px' });

    const fields = Object.entries(lead).filter(([k]) => !['id','read','archived','starred','notes'].includes(k));
    fields.forEach(([k, v]) => {
      const fieldCard = domEl('div', {
        style: 'background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:10px'
      });
      fieldCard.appendChild(domEl('div', {
        style: 'font-size:10px;color:var(--text3);margin-bottom:3px;text-transform:uppercase'
      }, k));
      fieldCard.appendChild(domEl('div', {
        style: 'font-size:13px;word-break:break-word'
      }, String(v !== null && v !== undefined ? v : '—')));
      grid.appendChild(fieldCard);
    });
    container.appendChild(grid);

    // Notes form group
    const notesGroup = domEl('div', { className: 'form-group' });
    notesGroup.appendChild(domEl('label', {}, 'Notes'));
    const notesText = domEl('textarea', {
      className: 'form-control',
      id: 'lead-notes',
      rows: '4',
      placeholder: 'Add private notes…'
    });
    notesText.value = lead.notes || '';
    notesGroup.appendChild(notesText);
    container.appendChild(notesGroup);

    // Action buttons bar
    const bar = domEl('div', { style: 'display:flex;gap:8px;margin-top:8px' });
    bar.appendChild(domEl('button', {
      className: `btn btn-sm ${lead.starred ? 'btn-warning' : 'btn-secondary'}`,
      onclick: () => toggleStar(id)
    }, lead.starred ? '⭐ Starred' : '☆ Star'));

    bar.appendChild(domEl('button', {
      className: 'btn btn-sm btn-secondary',
      onclick: () => archiveLead(id)
    }, '📦 Archive'));

    bar.appendChild(domEl('button', {
      className: 'btn btn-sm btn-primary',
      style: 'margin-left:auto',
      onclick: () => saveLeadNotes(id)
    }, '💾 Save Notes'));

    container.appendChild(bar);
    body.appendChild(container);
  }

  modal?.classList.add('open');
}

async function saveLeadNotes(id) {
  const notes = document.getElementById('lead-notes')?.value || '';
  await quickUpdateLead(id, 'notes', notes);
  Toast.success('Notes saved');
}

async function updateLeadStatus() {
  if (!currentLeadId) return;
  const sel = document.getElementById('lead-status-select');
  await quickUpdateLead(currentLeadId, 'status', sel?.value);
  Toast.success('Status updated');
}

async function quickUpdateLead(id, field, value) {
  const payload = { id };
  payload[field] = value;
  await API.post('/api/admin/leads/update', payload);
  const lead = allLeads.find(l => l.id === id);
  if (lead) lead[field] = value;
  renderLeads();
}

async function toggleStar(id) {
  const lead = allLeads.find(l => l.id === id);
  if (lead) await quickUpdateLead(id, 'starred', !lead.starred);
  openLead(id);
}

async function archiveLead(id) {
  await quickUpdateLead(id, 'archived', true);
  closeModal('lead-modal');
  Toast.info('Lead archived');
}

async function deleteCurrentLead() {
  if (!currentLeadId) return;
  await deleteLead(currentLeadId);
  closeModal('lead-modal');
}

async function deleteLead(id) {
  if (!confirm('Delete this lead permanently?')) return;
  await API.post('/api/admin/leads/delete', { id });
  allLeads = allLeads.filter(l => l.id !== id);
  renderLeads();
  updateLeadCount();
  Toast.success('Lead deleted');
}

async function bulkLeadAction(action) {
  if (!selectedLeadIds.length) return;
  if (action === 'delete' && !confirm(`Delete ${selectedLeadIds.length} leads?`)) return;
  await API.post('/api/admin/leads/bulk', { ids: selectedLeadIds, action });
  selectedLeadIds = [];
  await loadLeads();
  document.getElementById('bulk-actions')?.classList.add('hidden');
  Toast.success(`Bulk ${action} done`);
}

async function exportLeadsCSV() {
  try {
    const blob = await window.api('/api/admin/leads/export', { responseType: 'blob' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `leads-${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    Toast.success('Leads exported successfully');
  } catch {
    Toast.error('Export failed');
  }
}

function whatsAppLead(id) {
  const lead = allLeads.find(l => l.id === id);
  if (!lead || !lead.phone) { Toast.warning('No phone number'); return; }
  const cleanPhone = lead.phone.replace(/\D/g,'');
  const safeName = (lead.name || '').replace(/[\r\n]/g, ' ');
  const safeModel = (lead.model || 'our EV scooter').replace(/[\r\n]/g, ' ');
  const msg = `Hello ${safeName}, thank you for your enquiry about ${safeModel} at Jai Mata Di Auto. How can I assist you?`;
  window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  quickUpdateLead(id, 'status', 'contacted');
}

function whatsAppReplyLead() { if (currentLeadId) whatsAppLead(currentLeadId); }

/**
 * Public Spare Parts Catalog Script
 * API-powered server-side pagination, debounced search, skeleton loading, and cart.
 */
(function() {
  'use strict';

  // State
  let currentPage = 1;
  const pageLimit = 12;
  let totalPages = 1;
  let totalParts = 0;
  let currentCategory = 'All';
  let currentModel = 'All';
  let currentSearch = '';
  let currentSort = 'name-asc';
  let searchTimer = null;
  let isLoading = false;

  // Active page parts cache for cart additions
  let currentParts = [];
  let cart = JSON.parse(localStorage.getItem('sparePartsCart') || '[]');

  // Standard category & model filter lists
  const CATEGORIES = [
    'All', 'Lighting', 'Controls', 'Body', 'Frame & Suspension',
    'Accessories', 'Tyres & Wheels', 'Hardware', 'Electrical', 'Braking', 'Motor', 'Battery'
  ];

  // 15 Models: 7 Current Ampere Models first, 8 Older Models
  const CURRENT_MODELS = [
    'Nexus', 'Magnus Grand MAX', 'Magnus EX', 'Magnus GRAND',
    'Magnus Neo', 'Reo 80', 'Reo Li'
  ];

  const OLDER_MODELS = [
    'Primus', 'Zeal', 'MAGNUS PRO', 'MAGNUS 60 (2022)',
    'MAGNUS 60 (2020)', 'V48 2022', 'V48 Li', 'V48 LA'
  ];

  let showOlderModels = true; // Config flag: default true

  const $ = id => document.getElementById(id);

  function formatPaise(paise) {
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

  function safeUrl(u) {
    if (!u || typeof u !== 'string') return '#';
    const t = u.trim();
    if (t.startsWith('#') || (t.startsWith('/') && !t.startsWith('//')) || t.startsWith('./')) return t;
    if (t.startsWith('tel:') || t.startsWith('mailto:') || t.startsWith('https://wa.me/')) return t;
    if (t.startsWith('https://')) return t;
    return '#';
  }

  function initSpareParts() {
    renderCategoryFilters();
    renderModelFilters();
    renderCart();
    updateCartCount();

    // Debounced search (300ms)
    const searchInput = $('spSearch');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        currentSearch = e.target.value.trim();
        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          currentPage = 1;
          fetchSpareParts();
        }, 300);
      });
    }

    // Sort control
    const sortSelect = $('spSort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        currentSort = e.target.value;
        currentPage = 1;
        fetchSpareParts();
      });
    }

    // Cart toggles
    const cartToggle = $('spCartToggle');
    if (cartToggle) cartToggle.addEventListener('click', toggleCart);
    const cartClose = $('spCartClose');
    if (cartClose) cartClose.addEventListener('click', closeCart);
    const cartOverlay = $('spCartOverlay');
    if (cartOverlay) cartOverlay.addEventListener('click', closeCart);
    const checkoutBtn = $('spCheckoutBtn');
    if (checkoutBtn) checkoutBtn.addEventListener('click', checkoutCart);

    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeCart(); });

    // Initial fetch
    fetchSpareParts();
  }

  // ─── Filter Bar ──────────────────────────────────────────

  function renderCategoryFilters() {
    const container = $('spCats');
    if (!container) return;
    container.textContent = '';
    CATEGORIES.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'sp-cat-btn' + (cat === currentCategory ? ' active' : '');
      btn.dataset.cat = cat;
      btn.textContent = cat;
      btn.addEventListener('click', () => {
        if (currentCategory === cat) return;
        currentCategory = cat;
        document.querySelectorAll('.sp-cat-btn').forEach(b => b.classList.toggle('active', b.dataset.cat === currentCategory));
        currentPage = 1;
        fetchSpareParts();
      });
      container.appendChild(btn);
    });
  }

  function renderModelFilters() {
    const container = $('spModels');
    if (!container) return;
    container.textContent = '';

    // 'All' button
    const allBtn = document.createElement('button');
    allBtn.className = 'sp-model-btn' + (currentModel === 'All' ? ' active' : '');
    allBtn.dataset.model = 'All';
    allBtn.textContent = 'All Models';
    allBtn.addEventListener('click', () => {
      if (currentModel === 'All') return;
      currentModel = 'All';
      updateActiveModelBtns();
      currentPage = 1;
      fetchSpareParts();
    });
    container.appendChild(allBtn);

    // Current models (7 first)
    CURRENT_MODELS.forEach(m => {
      const btn = document.createElement('button');
      btn.className = 'sp-model-btn' + (m === currentModel ? ' active' : '');
      btn.dataset.model = m;
      btn.textContent = m;
      btn.addEventListener('click', () => {
        if (currentModel === m) return;
        currentModel = m;
        updateActiveModelBtns();
        currentPage = 1;
        fetchSpareParts();
      });
      container.appendChild(btn);
    });

    // Older models group if enabled
    if (showOlderModels) {
      const groupTitle = document.createElement('span');
      groupTitle.className = 'sp-model-group-title';
      groupTitle.textContent = 'Older models:';
      container.appendChild(groupTitle);

      OLDER_MODELS.forEach(m => {
        const btn = document.createElement('button');
        btn.className = 'sp-model-btn' + (m === currentModel ? ' active' : '');
        btn.dataset.model = m;
        btn.textContent = m;
        btn.addEventListener('click', () => {
          if (currentModel === m) return;
          currentModel = m;
          updateActiveModelBtns();
          currentPage = 1;
          fetchSpareParts();
        });
        container.appendChild(btn);
      });
    }
  }

  function updateActiveModelBtns() {
    document.querySelectorAll('.sp-model-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.model === currentModel);
    });
  }

  // ─── Data Fetching & Skeletons ─────────────────────────────

  function renderSkeletons() {
    const container = $('spGrid');
    if (!container) return;
    container.textContent = '';

    for (let i = 0; i < 8; i++) {
      const card = document.createElement('div');
      card.className = 'sp-card sp-card-skeleton';

      const img = document.createElement('div');
      img.className = 'sp-skeleton-img';
      card.appendChild(img);

      const body = document.createElement('div');
      body.className = 'sp-card-body';

      const line1 = document.createElement('div');
      line1.className = 'sp-skeleton-line short';
      body.appendChild(line1);

      const line2 = document.createElement('div');
      line2.className = 'sp-skeleton-line title';
      body.appendChild(line2);

      const line3 = document.createElement('div');
      line3.className = 'sp-skeleton-line code';
      body.appendChild(line3);

      const line4 = document.createElement('div');
      line4.className = 'sp-skeleton-line btn';
      body.appendChild(line4);

      card.appendChild(body);
      container.appendChild(card);
    }

    const stats = $('spStats');
    if (stats) stats.textContent = 'Searching catalog…';
  }

  async function fetchSpareParts() {
    if (isLoading) return;
    isLoading = true;
    renderSkeletons();

    const params = new URLSearchParams();
    if (currentSearch) params.set('q', currentSearch);
    if (currentCategory && currentCategory !== 'All') params.set('category', currentCategory);
    if (currentModel && currentModel !== 'All') params.set('model', currentModel);
    if (currentSort) params.set('sort', currentSort);
    params.set('page', String(currentPage));
    params.set('limit', String(pageLimit));

    try {
      const res = await window.api(`/api/public/spare-parts?${params.toString()}`);
      isLoading = false;
      if (res && res.success) {
        currentParts = res.data || [];
        totalParts = res.total || 0;
        totalPages = res.totalPages || 1;
        renderParts(currentParts, totalParts, currentPage, pageLimit);
        renderPagination();
      } else {
        renderFallbackError();
      }
    } catch (err) {
      isLoading = false;
      console.warn('[Spare Parts] Failed to load catalog from API:', err.message);
      renderFallbackError();
    }
  }

  function renderFallbackError() {
    const container = $('spGrid');
    if (!container) return;
    container.textContent = '';

    const stats = $('spStats');
    if (stats) stats.textContent = 'Catalog Offline';

    const fallback = document.createElement('div');
    fallback.className = 'sp-error-fallback';

    const icon = document.createElement('div');
    icon.className = 'sp-fallback-icon';
    icon.textContent = '📦';
    fallback.appendChild(icon);

    const h3 = document.createElement('h3');
    h3.textContent = 'Spare Parts Catalog Temporarily Offline';
    fallback.appendChild(h3);

    const p = document.createElement('p');
    p.textContent = 'We stock 100% genuine Ampere replacement parts for all models. Our live catalog is being refreshed, but our showroom is fully open for direct orders!';
    fallback.appendChild(p);

    const actions = document.createElement('div');
    actions.className = 'sp-fallback-actions';

    const phoneLink = document.createElement('a');
    phoneLink.href = 'tel:+919890202091';
    phoneLink.className = 'sp-fallback-btn outline';
    phoneLink.textContent = '📞 Call +91-9890202091';
    actions.appendChild(phoneLink);

    const waLink = document.createElement('a');
    waLink.href = 'https://wa.me/919890202091?text=Hi%2C%20I%20need%20spare%20parts%20for%20my%20Ampere%20scooter.';
    waLink.target = '_blank';
    waLink.rel = 'noopener noreferrer';
    waLink.className = 'sp-fallback-btn primary';
    waLink.textContent = '💬 Order via WhatsApp';
    actions.appendChild(waLink);

    fallback.appendChild(actions);
    container.appendChild(fallback);

    const pagEl = $('spPagination');
    if (pagEl) pagEl.textContent = '';
  }

  // ─── Parts Grid Rendering ─────────────────────────────────

  function renderParts(list, total, page, limit) {
    const container = $('spGrid');
    if (!container) return;
    container.textContent = '';

    const statsEl = $('spStats');
    if (statsEl) {
      statsEl.textContent = '';
      if (!list.length) {
        const strong = document.createElement('strong');
        strong.textContent = '0';
        statsEl.appendChild(strong);
        statsEl.appendChild(document.createTextNode(' parts found'));
      } else {
        const start = (page - 1) * limit + 1;
        const end = Math.min(page * limit, total);
        statsEl.appendChild(document.createTextNode('Showing '));
        const s1 = document.createElement('strong');
        s1.textContent = `${start}–${end}`;
        statsEl.appendChild(s1);
        statsEl.appendChild(document.createTextNode(' of '));
        const s2 = document.createElement('strong');
        s2.textContent = total;
        statsEl.appendChild(s2);
        statsEl.appendChild(document.createTextNode(' parts'));
      }
    }

    if (!list.length) {
      const emptyDiv = document.createElement('div');
      emptyDiv.className = 'sp-empty';
      emptyDiv.textContent = 'No spare parts match your filter criteria.';
      container.appendChild(emptyDiv);
      return;
    }

    list.forEach(p => {
      const inStock = p.stock !== null && p.stock !== undefined && Number(p.stock) > 0;
      const isEnquireStock = (p.stock === null || p.stock === undefined);
      const isHold = Boolean(p.needsVerification);
      const isPriceOnRequest = Boolean(p.priceOnRequest) || !p.price || Number(p.price) <= 0;
      const inCart = cart.find(c => String(c.id) === String(p.id));

      const card = document.createElement('div');
      card.className = 'sp-card';
      card.dataset.id = String(p.id);

      const imgWrap = document.createElement('div');
      imgWrap.className = 'sp-card-img-wrap';
      const img = document.createElement('img');
      img.src = safeUrl(p.image || 'assets/images/spare-parts-placeholder.svg');
      img.alt = p.name || 'Spare Part';
      img.loading = 'lazy';
      img.onerror = function() {
        this.onerror = null;
        this.src = 'assets/images/spare-parts-placeholder.svg';
      };
      imgWrap.appendChild(img);
      card.appendChild(imgWrap);

      const body = document.createElement('div');
      body.className = 'sp-card-body';

      const catEl = document.createElement('div');
      catEl.className = 'sp-card-category';
      catEl.textContent = p.category || 'General';
      body.appendChild(catEl);

      const nameEl = document.createElement('div');
      nameEl.className = 'sp-card-name';
      nameEl.title = p.name || '';
      nameEl.textContent = p.name || '';
      body.appendChild(nameEl);

      const codeEl = document.createElement('div');
      codeEl.className = 'sp-card-code';
      codeEl.textContent = (p.code || '') + ' ';
      const modelSpan = document.createElement('span');
      modelSpan.className = 'sp-card-model';
      modelSpan.textContent = p.model || '';
      codeEl.appendChild(modelSpan);
      body.appendChild(codeEl);

      const footer = document.createElement('div');
      footer.className = 'sp-card-footer';

      const priceWrap = document.createElement('div');
      priceWrap.className = 'sp-card-price-wrap';

      const priceLabel = document.createElement('div');
      priceLabel.className = 'sp-card-price-label';
      const priceNote = (window.JMD_CONFIG && window.JMD_CONFIG.priceNote) ? String(window.JMD_CONFIG.priceNote).trim() : '';
      priceLabel.textContent = priceNote ? `Retail price (${priceNote})` : 'Retail price';
      priceWrap.appendChild(priceLabel);

      const priceEl = document.createElement('div');
      if (isHold) {
        priceEl.className = 'sp-card-price special';
        priceEl.textContent = 'Confirm price on WhatsApp/call';
      } else if (isPriceOnRequest) {
        priceEl.className = 'sp-card-price special';
        priceEl.textContent = 'Price on request';
      } else {
        priceEl.className = 'sp-card-price';
        priceEl.textContent = formatPaise(p.price);
      }
      priceWrap.appendChild(priceEl);
      footer.appendChild(priceWrap);

      const stockEl = document.createElement('span');
      if (isEnquireStock) {
        stockEl.className = 'sp-card-stock enquire';
        stockEl.textContent = 'Enquire for availability';
      } else if (inStock) {
        stockEl.className = 'sp-card-stock in';
        stockEl.textContent = 'In Stock';
      } else {
        stockEl.className = 'sp-card-stock out';
        stockEl.textContent = 'Out of Stock';
      }
      footer.appendChild(stockEl);
      body.appendChild(footer);

      const addBtn = document.createElement('button');
      addBtn.dataset.id = String(p.id);

      if (isHold) {
        addBtn.className = 'sp-add-btn whatsapp-enquire';
        addBtn.textContent = '💬 Confirm on WhatsApp';
        addBtn.addEventListener('click', () => {
          const waNum = (window.JMD_CONFIG && window.JMD_CONFIG.whatsapp) ? window.JMD_CONFIG.whatsapp.replace(/[^0-9]/g, '') : '919890202091';
          const msg = encodeURIComponent(`Hi, I would like to confirm the price and availability for spare part: ${p.name} (Code: ${p.code}, Model: ${p.model}).`);
          window.open(`https://wa.me/${waNum}?text=${msg}`, '_blank');
        });
      } else if (isPriceOnRequest) {
        addBtn.className = 'sp-add-btn out';
        addBtn.disabled = true;
        addBtn.textContent = 'Price on Request';
      } else {
        addBtn.className = 'sp-add-btn';
        addBtn.textContent = inCart ? `In Cart (${inCart.qty})` : 'Add to Cart';
        addBtn.addEventListener('click', () => addToCart(p.id));
      }
      body.appendChild(addBtn);

      card.appendChild(body);
      container.appendChild(card);
    });
  }

  // ─── Pagination Controls ──────────────────────────────────

  function renderPagination() {
    const container = $('spPagination');
    if (!container) return;
    container.textContent = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevBtn = document.createElement('button');
    prevBtn.className = 'sp-page-btn';
    prevBtn.textContent = '← Prev';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => goToPage(currentPage - 1));
    container.appendChild(prevBtn);

    // Page numbers with ellipsis
    const maxVisible = 5;
    let startPage = Math.max(1, currentPage - 2);
    let endPage = Math.min(totalPages, startPage + maxVisible - 1);
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    if (startPage > 1) {
      appendPageBtn(container, 1);
      if (startPage > 2) {
        const dots = document.createElement('span');
        dots.className = 'sp-page-dots';
        dots.textContent = '…';
        container.appendChild(dots);
      }
    }

    for (let p = startPage; p <= endPage; p++) {
      appendPageBtn(container, p);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'sp-page-dots';
        dots.textContent = '…';
        container.appendChild(dots);
      }
      appendPageBtn(container, totalPages);
    }

    // Next Button
    const nextBtn = document.createElement('button');
    nextBtn.className = 'sp-page-btn';
    nextBtn.textContent = 'Next →';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => goToPage(currentPage + 1));
    container.appendChild(nextBtn);
  }

  function appendPageBtn(container, pageNum) {
    const btn = document.createElement('button');
    btn.className = 'sp-page-btn' + (pageNum === currentPage ? ' active' : '');
    btn.textContent = pageNum;
    btn.addEventListener('click', () => goToPage(pageNum));
    container.appendChild(btn);
  }

  function goToPage(p) {
    if (p < 1 || p > totalPages || p === currentPage) return;
    currentPage = p;
    fetchSpareParts();
    const controlBar = $('spControlBar');
    if (controlBar) {
      controlBar.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ─── Shopping Cart Operations ─────────────────────────────

  function addToCart(id) {
    const part = currentParts.find(p => String(p.id) === String(id));
    if (!part || part.needsVerification || part.priceOnRequest || !part.price || Number(part.price) <= 0) return;

    const existing = cart.find(c => String(c.id) === String(part.id));
    if (existing) {
      existing.qty += 1;
    } else {
      cart.push({
        id: String(part.id),
        name: part.name,
        code: part.code,
        model: part.model,
        pricePaise: Number(part.price),
        qty: 1
      });
    }

    saveCart();
    renderCart();
    updateCartCount();
    // Update button text on active page
    document.querySelectorAll(`.sp-add-btn[data-id="${part.id}"]`).forEach(btn => {
      const item = cart.find(c => String(c.id) === String(part.id));
      if (item) btn.textContent = `In Cart (${item.qty})`;
    });
    toggleCart();
  }

  function removeFromCart(id) {
    cart = cart.filter(c => String(c.id) !== String(id));
    saveCart();
    renderCart();
    updateCartCount();
    document.querySelectorAll(`.sp-add-btn[data-id="${id}"]`).forEach(btn => {
      btn.textContent = 'Add to Cart';
    });
  }

  function updateQty(id, delta) {
    const item = cart.find(c => String(c.id) === String(id));
    if (!item) return;
    item.qty += delta;
    if (item.qty <= 0) {
      removeFromCart(id);
      return;
    }
    saveCart();
    renderCart();
    updateCartCount();
    document.querySelectorAll(`.sp-add-btn[data-id="${id}"]`).forEach(btn => {
      btn.textContent = `In Cart (${item.qty})`;
    });
  }

  function saveCart() {
    localStorage.setItem('sparePartsCart', JSON.stringify(cart));
  }

  function updateCartCount() {
    const countEl = $('spCartCount');
    if (countEl) countEl.textContent = cart.reduce((s, c) => s + c.qty, 0);
  }

  function toggleCart() {
    const cartEl = $('spCart');
    const overlay = $('spCartOverlay');
    if (cartEl) cartEl.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
  }

  function closeCart() {
    const cartEl = $('spCart');
    const overlay = $('spCartOverlay');
    if (cartEl) cartEl.classList.remove('open');
    if (overlay) overlay.classList.remove('open');
  }

  function renderCart() {
    const container = $('spCartItems');
    const totalEl = $('spCartTotal');
    if (!container || !totalEl) return;
    container.textContent = '';

    if (!cart.length) {
      const empty = document.createElement('div');
      empty.className = 'sp-cart-empty';
      empty.textContent = 'Your cart is empty. Browse parts and add them here.';
      container.appendChild(empty);
      totalEl.textContent = '₹0';
      return;
    }

    cart.forEach(c => {
      const item = document.createElement('div');
      item.className = 'sp-cart-item';

      const img = document.createElement('div');
      img.className = 'sp-ci-img';
      img.textContent = (c.code || 'JMD').slice(0, 3).toUpperCase();
      item.appendChild(img);

      const info = document.createElement('div');
      info.className = 'sp-ci-info';

      const name = document.createElement('div');
      name.className = 'sp-ci-name';
      name.textContent = c.name || '';
      info.appendChild(name);

      const code = document.createElement('div');
      code.className = 'sp-ci-code';
      code.textContent = (c.code || '') + (c.model ? ` (${c.model})` : '');
      info.appendChild(code);

      const meta = document.createElement('div');
      meta.className = 'sp-ci-meta';

      const qtyWrap = document.createElement('div');
      qtyWrap.className = 'sp-ci-qty';

      const decBtn = document.createElement('button');
      decBtn.textContent = '−';
      decBtn.addEventListener('click', () => updateQty(c.id, -1));
      qtyWrap.appendChild(decBtn);

      const qtySpan = document.createElement('span');
      qtySpan.textContent = c.qty;
      qtyWrap.appendChild(qtySpan);

      const incBtn = document.createElement('button');
      incBtn.textContent = '+';
      incBtn.addEventListener('click', () => updateQty(c.id, 1));
      qtyWrap.appendChild(incBtn);

      meta.appendChild(qtyWrap);

      const price = document.createElement('div');
      price.className = 'sp-ci-price';
      price.textContent = formatPaise(c.pricePaise * c.qty);
      meta.appendChild(price);

      const rmBtn = document.createElement('button');
      rmBtn.className = 'sp-ci-remove';
      rmBtn.textContent = '✕';
      rmBtn.addEventListener('click', () => removeFromCart(c.id));
      meta.appendChild(rmBtn);

      info.appendChild(meta);
      item.appendChild(info);
      container.appendChild(item);
    });

    const totalPaise = cart.reduce((s, c) => s + (c.pricePaise * c.qty), 0);
    totalEl.textContent = formatPaise(totalPaise);
  }

  function checkoutCart() {
    if (!cart.length) return;
    const orderable = cart.filter(c => !c.needsVerification && !c.priceOnRequest && c.pricePaise > 0);
    if (!orderable.length) return;
    const totalPaise = orderable.reduce((s, c) => s + (c.pricePaise * c.qty), 0);
    const totalFormatted = formatPaise(totalPaise);
    const items = orderable.map(c => `• ${c.name} [Code: ${c.code}] [Model: ${c.model || 'Universal'}] x${c.qty} - ${formatPaise(c.pricePaise * c.qty)}`).join('\n');
    const msg = encodeURIComponent(`Spare Parts Enquiry:\n\n${items}\n\nTotal: ${totalFormatted}\n\nFrom Jai Mata Di Auto Spare Parts Store`);
    const waNumber = (window.JMD_CONFIG && window.JMD_CONFIG.whatsapp) ? window.JMD_CONFIG.whatsapp.replace(/[^0-9]/g, '') : '919890202091';
    window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSpareParts);
  } else {
    initSpareParts();
  }
})();

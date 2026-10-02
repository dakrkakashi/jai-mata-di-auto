/**
 * Dynamic CMS Content Loader (Graceful Offline Fallback)
 * Fetches /api/content on page load. If reachable, updates data-jmd-edit elements.
 * If offline or backend unreachable, leaves existing static HTML markup untouched!
 * Enforces textContent and safeUrl validation to prevent stored XSS.
 */
(async function initCMSContent() {
  try {
    const pageName = window.location.pathname.split('/').pop() || 'index.html';
    if (typeof window.api !== 'function') return;
    const content = await window.api(`/api/content?page=${encodeURIComponent(pageName)}`);
    if (!content || typeof content !== 'object') return;

    const safeUrl = window.safeUrl || function(u) {
      if (!u || typeof u !== 'string') return '#';
      const t = u.trim();
      if (t.startsWith('#') || (t.startsWith('/') && !t.startsWith('//')) || t.startsWith('./')) return t;
      if (t.startsWith('tel:') || t.startsWith('mailto:') || t.startsWith('https://wa.me/')) return t;
      if (t.startsWith('https://')) return t;
      return '#';
    };

    document.querySelectorAll('[data-jmd-edit]').forEach(el => {
      const key = el.getAttribute('data-jmd-edit');
      const val = content[key];
      if (val !== undefined && val !== null) {
        if (el.tagName === 'IMG') {
          el.src = safeUrl(String(val));
        } else if (el.tagName === 'A') {
          el.href = safeUrl(String(val));
        } else {
          el.textContent = String(val);
        }
      }
    });
  } catch (err) {
    console.log('[CMS Content] Offline mode: using static HTML content.');
  }
})();

/* ─── Toast notification system (XSS-Safe DOM) ─── */
const Toast = (() => {
  let container;
  function getContainer() {
    if (!container) {
      container = document.createElement('div');
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  function show(msg, type = 'success', title = '') {
    const c = getContainer();
    const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };

    const t = document.createElement('div');
    t.className = `toast ${type}`;

    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || '💬';

    const textDiv = document.createElement('div');
    textDiv.className = 'toast-text';

    if (title) {
      const titleDiv = document.createElement('div');
      titleDiv.className = 'toast-title';
      titleDiv.textContent = title;
      textDiv.appendChild(titleDiv);
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'toast-msg';
    msgDiv.textContent = String(msg || '');
    textDiv.appendChild(msgDiv);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'toast-close';
    closeBtn.textContent = '✕';
    closeBtn.onclick = () => t.remove();

    t.replaceChildren(iconSpan, textDiv, closeBtn);
    c.appendChild(t);

    setTimeout(() => {
      t.style.animation = 'slideInRight 0.3s ease reverse';
      setTimeout(() => t.remove(), 280);
    }, 3200);

    return t;
  }

  return {
    success: (msg, title) => show(msg, 'success', title),
    error:   (msg, title) => show(msg, 'error',   title),
    warning: (msg, title) => show(msg, 'warning', title),
    info:    (msg, title) => show(msg, 'info',     title),
  };
})();

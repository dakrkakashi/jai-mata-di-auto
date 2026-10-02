/* ─── Auth functions for admin panel ─── */
'use strict';

// Check if logged in (call on every protected page)
async function checkAuth() {
  try {
    const res = await window.api('/api/admin/check-auth');
    if (!res || !res.authenticated) {
      redirect();
      return false;
    }
    return true;
  } catch (err) {
    redirect();
    return false;
  }

  function redirect() {
    if (!window.location.pathname.endsWith('login.html')) {
      window.location.href = '/admin/login.html';
    }
  }
}

// Login form submission
async function attemptLogin() {
  const pw = document.getElementById('login-password')?.value?.trim();
  const remember = document.getElementById('remember-me')?.checked;
  const btn = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  const lockoutEl = document.getElementById('login-lockout');
  if (!pw) return;

  btn.textContent = 'Signing in…';
  btn.disabled = true;
  if (errEl) {
    errEl.textContent = '';
    errEl.style.display = 'none';
  }

  try {
    const data = await window.api('/api/admin/login', {
      method: 'POST',
      body: { password: pw, rememberMe: remember }
    });
    if (data && data.success) {
      window.location.href = '/admin/dashboard.html';
    } else {
      if (errEl) {
        errEl.textContent = data.error || 'Wrong password';
        errEl.style.display = 'block';
      }
      const card = document.getElementById('login-card');
      if (card) {
        card.style.animation = 'shake 0.5s ease';
        setTimeout(() => (card.style.animation = ''), 550);
      }
      if (data.error?.includes('Too many')) {
        if (lockoutEl?.style) lockoutEl.style.display = 'block';
      }
      btn.textContent = 'Sign In →';
      btn.disabled = false;
    }
  } catch (e) {
    if (errEl) {
      errEl.textContent = e.error || e.message || 'Cannot connect to server';
      errEl.style.display = 'block';
    }
    btn.textContent = 'Sign In →';
    btn.disabled = false;
  }
}

// Logout
async function logout() {
  await window.api('/api/admin/logout', { method: 'POST' }).catch(() => {});
  window.location.href = '/admin/login.html';
}

// Handle Enter key on password field
document.addEventListener('DOMContentLoaded', () => {
  const pwField = document.getElementById('login-password');
  if (pwField) {
    pwField.addEventListener('keydown', e => {
      if (e.key === 'Enter') attemptLogin();
    });
  }
});

/**
 * Jai Mata Di Auto — Universal Frontend Configuration & API Client
 * Single canonical client for all public and admin requests.
 */
(function() {
  'use strict';

  // API base URL configuration:
  // Local development defaults to http://localhost:3000.
  // Production deployment value (documented in docs/DEPLOY.md) is https://api.jaimatadiauto.in.
  if (!window.JMD_API_BASE) {
    const isLocal = typeof window !== 'undefined' && (
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname === '' ||
      window.location.protocol === 'file:'
    );
    window.JMD_API_BASE = isLocal ? 'http://localhost:3000' : 'https://api.jaimatadiauto.in';
  }

  /**
   * Universal API fetch client:
   * - credentials: 'include' (strict cookie-based session auth, no tokens stored in localStorage)
   * - 8-second timeout via AbortController
   * - Automatic JSON serialization and parsing
   * - Consistent structured error objects
   */
  async function api(endpoint, options = {}) {
    const base = (window.JMD_API_BASE || 'http://localhost:3000').replace(/\/+$/, '');
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : '/' + endpoint;
    const url = (endpoint.startsWith('http://') || endpoint.startsWith('https://'))
      ? endpoint
      : `${base}${cleanEndpoint}`;

    const headers = { ...(options.headers || {}) };
    let body = options.body;

    if (body && typeof body === 'object' && !(body instanceof FormData) && !(body instanceof Blob)) {
      if (!headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }
      body = JSON.stringify(body);
    }

    // 8-second timeout controller
    const controller = new AbortController();
    const timeoutMs = typeof options.timeout === 'number' ? options.timeout : 8000;
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    // If caller provided an external abort signal, chain it
    if (options.signal) {
      options.signal.addEventListener('abort', () => controller.abort());
    }

    const fetchOptions = {
      credentials: 'include',
      ...options,
      headers,
      body,
      signal: controller.signal
    };

    let res;
    try {
      res = await fetch(url, fetchOptions);
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isAbort = controller.signal.aborted;
      const errorMsg = isAbort ? `Request timed out after ${timeoutMs / 1000}s` : (fetchErr.message || 'Network connection failed');
      const err = new Error(errorMsg);
      err.success = false;
      err.status = isAbort ? 408 : 0;
      err.error = errorMsg;
      err.data = null;
      throw err;
    } finally {
      clearTimeout(timeoutId);
    }

    // Global 401 Unauthorized handling for admin views
    if (res.status === 401) {
      if (typeof window !== 'undefined' &&
          window.location.pathname.includes('/admin/') &&
          !window.location.pathname.endsWith('login.html')) {
        window.location.href = '/admin/login.html';
      }
    }

    // Binary / blob response handling
    if (options.responseType === 'blob') {
      if (!res.ok) {
        const err = new Error(`HTTP ${res.status}: ${res.statusText}`);
        err.success = false;
        err.status = res.status;
        err.error = `HTTP ${res.status}: ${res.statusText}`;
        throw err;
      }
      return await res.blob();
    }

    const ct = res.headers.get('content-type') || '';
    const isJson = ct.includes('application/json');
    let data;
    try {
      data = isJson ? await res.json() : await res.text();
    } catch (parseErr) {
      data = null;
    }

    if (!res.ok) {
      const errorMsg = (data && typeof data === 'object' && data.error)
        ? data.error
        : (typeof data === 'string' && data.length < 200 && data.trim())
          ? data.trim()
          : `HTTP ${res.status}: ${res.statusText}`;

      const err = new Error(errorMsg);
      err.success = false;
      err.status = res.status;
      err.error = errorMsg;
      err.data = data;
      throw err;
    }

    return data;
  }

  // HTTP method shortcuts
  api.get = (url, opts = {}) => api(url, { ...opts, method: 'GET' });
  api.post = (url, data, opts = {}) => api(url, { ...opts, method: 'POST', body: data });
  api.put = (url, data, opts = {}) => api(url, { ...opts, method: 'PUT', body: data });
  api.delete = (url, data, opts = {}) => api(url, { ...opts, method: 'DELETE', body: data });

  // Expose as window.api, window.jmdApi, and window.API
  window.api = api;
  window.jmdApi = api;
  window.API = api;
})();

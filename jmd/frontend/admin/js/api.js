/* ─── API wrapper for admin panel (delegates to canonical window.api) ─── */
'use strict';

const API = window.API || window.api || {
  get:    (url, opts)       => window.api(url, { ...opts, method: 'GET' }),
  post:   (url, data, opts) => window.api(url, { ...opts, method: 'POST', body: data }),
  put:    (url, data, opts) => window.api(url, { ...opts, method: 'PUT', body: data }),
  delete: (url, data, opts) => window.api(url, { ...opts, method: 'DELETE', body: data }),
  getToken: () => '',
  getBaseUrl: () => window.JMD_API_BASE || '',
  request: (url, opts) => window.api(url, opts)
};

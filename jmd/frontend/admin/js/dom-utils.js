/**
 * Shared Safe DOM Utilities for Jai Mata Di Auto Admin
 * Enforces textContent/createElement, URL validation, and prevents XSS
 */
(function (root) {
  'use strict';

  function safeUrl(url) {
    if (!url || typeof url !== 'string') return '#';
    const trimmed = url.trim();

    if (trimmed.startsWith('#')) return trimmed;
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;
    if (trimmed.startsWith('./') || trimmed.startsWith('../')) return trimmed;

    if (trimmed.startsWith('tel:')) {
      const cleanPhone = trimmed.replace(/[^\d+]/g, '');
      return 'tel:' + cleanPhone;
    }
    if (trimmed.startsWith('mailto:')) {
      return trimmed;
    }
    if (trimmed.startsWith('https://wa.me/')) {
      return trimmed;
    }
    if (trimmed.startsWith('https://')) {
      try {
        const parsed = new URL(trimmed);
        if (parsed.protocol === 'https:') return trimmed;
      } catch {
        return '#';
      }
    }

    return '#';
  }

  function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);

    if (attrs && typeof attrs === 'object') {
      for (const [key, val] of Object.entries(attrs)) {
        if (val === null || val === undefined) continue;

        if (key === 'className' || key === 'class') {
          element.className = val;
        } else if (key === 'style') {
          if (typeof val === 'object') {
            Object.assign(element.style, val);
          } else {
            element.style.cssText = val;
          }
        } else if (key === 'href' || key === 'src') {
          element.setAttribute(key, safeUrl(val));
        } else if (key === 'textContent' || key === 'text') {
          element.textContent = val;
        } else if (key === 'dataset' && typeof val === 'object') {
          for (const [dKey, dVal] of Object.entries(val)) {
            element.dataset[dKey] = dVal;
          }
        } else if (key.startsWith('on') && typeof val === 'function') {
          const eventName = key.slice(2).toLowerCase();
          element.addEventListener(eventName, val);
        } else if (key === 'disabled' || key === 'checked' || key === 'selected') {
          if (val) {
            element.setAttribute(key, '');
            element[key] = true;
          } else {
            element.removeAttribute(key);
            element[key] = false;
          }
        } else {
          element.setAttribute(key, val);
        }
      }
    }

    function appendChild(child) {
      if (child === null || child === undefined) return;
      if (Array.isArray(child)) {
        child.forEach(appendChild);
      } else if (child instanceof Node) {
        element.appendChild(child);
      } else {
        element.appendChild(document.createTextNode(String(child)));
      }
    }

    children.forEach(appendChild);
    return element;
  }

  root.safeUrl = safeUrl;
  root.el = el;
  root.JMD_DOM = { safeUrl, el };
})(typeof window !== 'undefined' ? window : globalThis);

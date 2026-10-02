/* ─── Visual Page Editor ─── */
'use strict';

const Editor = (() => {

  const ELEMENTS = {
    text:       { icon: '📝', label: 'Text',       html: '<p class="jmd-block" contenteditable="true" style="padding:10px 0;font-size:16px;color:#333;line-height:1.6">Click to edit this paragraph. Add your content here.</p>' },
    heading:    { icon: '📌', label: 'Heading',    html: '<h2 class="jmd-block" contenteditable="true" style="font-size:32px;font-weight:700;color:#1a1a2e;padding:8px 0">Your Heading Here</h2>' },
    subheading: { icon: '🔤', label: 'Subheading', html: '<h3 class="jmd-block" contenteditable="true" style="font-size:22px;font-weight:600;color:#333;padding:6px 0">Subheading</h3>' },
    button:     { icon: '🔘', label: 'Button',     html: '<div class="jmd-block" style="padding:10px 0"><button style="padding:12px 28px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer;transition:opacity 0.2s" onmouseover="this.style.opacity=\'0.8\'" onmouseout="this.style.opacity=\'1\'">Click Me</button></div>' },
    image:      { icon: '🖼', label: 'Image',      html: '<div class="jmd-block" style="padding:10px 0"><img src="https://placehold.co/800x400/6366f1/white?text=Your+Image" style="max-width:100%;height:auto;display:block;border-radius:8px" alt="Image"></div>' },
    divider:    { icon: '➖', label: 'Divider',    html: '<hr class="jmd-block" style="border:none;border-top:2px solid #6366f1;margin:20px 0">' },
    spacer:     { icon: '↕️', label: 'Spacer',     html: '<div class="jmd-block" style="height:60px;background:transparent"></div>' },
    youtube:    { icon: '▶️', label: 'YouTube',    html: '<div class="jmd-block" style="position:relative;padding-bottom:56.25%;height:0;overflow:hidden;border-radius:8px;margin:10px 0;background:#000"><iframe src="https://www.youtube.com/embed/dQw4w9WgXcQ" style="position:absolute;top:0;left:0;width:100%;height:100%;border:none" allowfullscreen title="YouTube video"></iframe></div>' },
    map:        { icon: '🗺', label: 'Map',        html: '<div class="jmd-block" style="margin:10px 0"><iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14130.25!2d77.694!3d28.75!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjjCsDQ1!5e0!3m2!1sen!2sin!4v1" style="width:100%;height:300px;border:0;border-radius:8px" allowfullscreen title="Map"></iframe></div>' },
    gallery:    { icon: '🖼', label: 'Gallery',    html: '<div class="jmd-block" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;padding:10px 0"><img src="https://placehold.co/300x200/6366f1/white" style="width:100%;height:120px;object-fit:cover;border-radius:6px" alt="Gallery 1"><img src="https://placehold.co/300x200/8b5cf6/white" style="width:100%;height:120px;object-fit:cover;border-radius:6px" alt="Gallery 2"><img src="https://placehold.co/300x200/ec4899/white" style="width:100%;height:120px;object-fit:cover;border-radius:6px" alt="Gallery 3"></div>' },
    form:       { icon: '📋', label: 'Form',       html: '<div class="jmd-block" style="padding:24px;background:#f8f9fa;border-radius:12px;margin:10px 0"><h3 style="margin-bottom:18px;font-size:20px">Contact Us</h3><div style="margin-bottom:12px"><input type="text" placeholder="Your Name" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none"></div><div style="margin-bottom:12px"><input type="email" placeholder="Email Address" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none"></div><div style="margin-bottom:12px"><input type="tel" placeholder="Phone Number" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none"></div><div style="margin-bottom:16px"><textarea placeholder="Your message..." style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;height:100px;resize:none;outline:none"></textarea></div><button style="width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:16px;font-weight:600;cursor:pointer">Send Message</button></div>' },
    accordion:  { icon: '❓', label: 'FAQ',        html: '<div class="jmd-block" style="margin:10px 0"><details style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;padding:0"><summary style="padding:14px 18px;cursor:pointer;font-weight:600;font-size:15px;list-style:none">❓ What is your question?</summary><div style="padding:12px 18px 16px;color:#555;line-height:1.6">Your answer goes here. You can add detailed information to help visitors.</div></details><details style="border:1px solid #e5e7eb;border-radius:8px;margin-bottom:8px;padding:0"><summary style="padding:14px 18px;cursor:pointer;font-weight:600;font-size:15px;list-style:none">❓ Another question here?</summary><div style="padding:12px 18px 16px;color:#555;line-height:1.6">Another detailed answer goes here.</div></details></div>' },
    countdown:  { icon: '⏱', label: 'Timer',      html: '<div class="jmd-block" style="text-align:center;padding:32px;background:linear-gradient(135deg,#6366f1,#8b5cf6);border-radius:12px;color:white;margin:10px 0"><h3 style="margin-bottom:20px;font-size:20px">Special Offer Ends In</h3><div style="display:flex;justify-content:center;gap:16px"><div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:12px 20px"><div style="font-size:36px;font-weight:800" id="cd-hours">23</div><div style="font-size:11px;opacity:0.8">HRS</div></div><div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:12px 20px"><div style="font-size:36px;font-weight:800" id="cd-min">59</div><div style="font-size:11px;opacity:0.8">MIN</div></div><div style="background:rgba(255,255,255,0.2);border-radius:8px;padding:12px 20px"><div style="font-size:36px;font-weight:800" id="cd-sec">59</div><div style="font-size:11px;opacity:0.8">SEC</div></div></div></div>' },
    whatsapp:   { icon: '💬', label: 'WhatsApp',   html: '<div class="jmd-block" style="padding:10px 0"><a href="https://wa.me/919890202091?text=Hello%2C%20I%20want%20to%20know%20more" target="_blank" style="display:inline-flex;align-items:center;gap:10px;padding:14px 24px;background:#25d366;color:white;border-radius:50px;text-decoration:none;font-weight:600;font-size:15px;box-shadow:0 4px 15px rgba(37,211,102,0.4)">💬 Chat on WhatsApp</a></div>' },
    html:       { icon: '💻', label: 'HTML',       html: '<div class="jmd-block jmd-custom-html" data-raw="<p>Custom HTML here</p>" style="padding:10px;border:1px dashed #ccc;border-radius:4px;min-height:40px"><p>Custom HTML here</p></div>' },
    iframe:     { icon: '🔲', label: 'iFrame',     html: '<div class="jmd-block" style="margin:10px 0"><iframe src="about:blank" style="width:100%;height:300px;border:1px solid #eee;border-radius:8px" title="Embedded content"></iframe></div>' },
    carousel:   { icon: '🎠', label: 'Carousel',   html: '<div class="jmd-block jmd-carousel" style="position:relative;overflow:hidden;border-radius:12px;margin:10px 0"><div style="display:flex;transition:transform 0.5s ease" id="carousel-inner"><div style="min-width:100%;background:linear-gradient(135deg,#6366f1,#8b5cf6);height:200px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:600">Slide 1</div><div style="min-width:100%;background:linear-gradient(135deg,#ec4899,#f97316);height:200px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:600">Slide 2</div><div style="min-width:100%;background:linear-gradient(135deg,#14b8a6,#3b82f6);height:200px;display:flex;align-items:center;justify-content:center;color:white;font-size:20px;font-weight:600">Slide 3</div></div><button onclick="(function(el){var i=el,d=i.querySelector(\'[id^=carousel-inner]\')|| i.querySelector(\'div>div\');var p=parseInt(d.dataset.pos||0);p=(p-1+3)%3;d.dataset.pos=p;d.style.transform=\'translateX(-\'+p*100+\'%\')\';})(this.parentElement)" style="position:absolute;left:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.3);border:none;color:white;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px">‹</button><button onclick="(function(el){var i=el,d=i.querySelector(\'[id^=carousel-inner]\')||i.querySelector(\'div>div\');var p=parseInt(d.dataset.pos||0);p=(p+1)%3;d.dataset.pos=p;d.style.transform=\'translateX(-\'+p*100+\'%\')\';})(this.parentElement)" style="position:absolute;right:10px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.3);border:none;color:white;width:36px;height:36px;border-radius:50%;cursor:pointer;font-size:18px">›</button></div>' },
  };

  const TEMPLATES = {
    'hero-gradient': (s) => `<section style="background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:80px 40px;text-align:center;color:white"><h1 style="font-size:48px;font-weight:800;margin-bottom:16px;line-height:1.2">${s.siteName || 'Welcome to Our Site'}</h1><p style="font-size:20px;opacity:0.9;margin-bottom:32px;max-width:600px;margin-left:auto;margin-right:auto">${s.tagline || 'Your premium service'}</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><button style="padding:14px 32px;background:white;color:#6366f1;border:none;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer">Get Started</button><a href="https://wa.me/${s.whatsapp||''}" style="padding:14px 32px;background:rgba(255,255,255,0.2);color:white;border:2px solid white;border-radius:8px;font-size:16px;font-weight:600;text-decoration:none">💬 WhatsApp</a></div></section>`,
    'hero-split'   : () => `<section style="display:grid;grid-template-columns:1fr 1fr;gap:40px;padding:60px 40px;align-items:center;background:#fff;max-width:100%"><div><p style="color:#6366f1;font-weight:600;font-size:14px;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Welcome</p><h1 style="font-size:40px;font-weight:800;color:#1a1a2e;line-height:1.2;margin-bottom:16px">Your Headline<br>Goes Here</h1><p style="font-size:16px;color:#666;line-height:1.6;margin-bottom:24px">Your compelling description goes here. Make it count and convince visitors to take action.</p><button style="padding:12px 28px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Call to Action</button></div><div><img src="https://placehold.co/500x400/6366f1/white?text=Hero+Image" style="width:100%;border-radius:16px" alt="Hero"></div></section>`,
    'hero-minimal' : () => `<section style="padding:100px 40px;text-align:center;background:#fafafa;border-bottom:1px solid #eee"><p style="color:#6366f1;font-size:13px;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">Trusted by thousands</p><h1 style="font-size:56px;font-weight:900;color:#1a1a2e;margin-bottom:16px;line-height:1.1">Simple.<br>Powerful.</h1><p style="font-size:18px;color:#666;margin-bottom:36px;max-width:500px;margin-left:auto;margin-right:auto">Build beautiful pages with no code.</p><button style="padding:16px 40px;background:#6366f1;color:white;border:none;border-radius:50px;font-size:16px;font-weight:700;cursor:pointer">Start Free →</button></section>`,
    'features-3col': () => `<section style="padding:60px 40px;background:#fff"><h2 style="text-align:center;font-size:36px;font-weight:800;color:#1a1a2e;margin-bottom:8px">Why Choose Us?</h2><p style="text-align:center;color:#666;margin-bottom:40px;font-size:16px">Everything you need in one place</p><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px">${['⭐ Premium Quality','🚀 Fast Delivery','💎 Best Value'].map((t,i) => `<div style="text-align:center;padding:32px 20px;background:#f8f9fa;border-radius:16px;border:1px solid #eee"><div style="font-size:48px;margin-bottom:16px">${['⭐','🚀','💎'][i]}</div><h3 style="font-size:18px;font-weight:700;color:#1a1a2e;margin-bottom:10px">${t.slice(3)}</h3><p style="font-size:14px;color:#666;line-height:1.6">Feature description goes here. Explain the benefit clearly.</p></div>`).join('')}</div></section>`,
    'testimonials' : () => `<section style="padding:60px 40px;background:#f8f9fa"><h2 style="text-align:center;font-size:36px;font-weight:800;color:#1a1a2e;margin-bottom:40px">What Our Customers Say</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:20px">${[{n:'Rahul Sharma',r:'5/5',t:'Amazing service! Highly recommended to everyone.'},{n:'Priya Gupta',r:'5/5',t:'Best purchase I ever made. Very satisfied!'},{n:'Amit Singh',r:'5/5',t:'Excellent quality and great support team.'}].map(t => `<div style="background:white;border-radius:12px;padding:24px;border:1px solid #eee"><div style="font-size:20px;margin-bottom:8px">⭐⭐⭐⭐⭐</div><p style="font-size:14px;color:#444;line-height:1.6;margin-bottom:16px;font-style:italic">"${t.t}"</p><div style="display:flex;align-items:center;gap:10px"><div style="width:36px;height:36px;background:#6366f1;border-radius:50%;display:flex;align-items:center;justify-content:center;color:white;font-weight:700">${t.n[0]}</div><div><strong style="font-size:13px">${t.n}</strong><div style="font-size:11px;color:#888">${t.r}</div></div></div></div>`).join('')}</div></section>`,
    'cta-banner'   : (s) => `<section style="background:linear-gradient(135deg,#1a1a2e,#6366f1);padding:60px 40px;text-align:center;color:white"><h2 style="font-size:36px;font-weight:800;margin-bottom:12px">Ready to Get Started?</h2><p style="font-size:18px;opacity:0.85;margin-bottom:32px">Contact us today and experience the difference.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap"><a href="tel:${s.phone||''}" style="padding:14px 28px;background:white;color:#6366f1;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">📞 Call Now</a><a href="https://wa.me/${s.whatsapp||''}" style="padding:14px 28px;background:#25d366;color:white;border-radius:8px;font-weight:700;text-decoration:none;font-size:15px">💬 WhatsApp</a></div></section>`,
    'stats-counter': () => `<section style="padding:60px 40px;background:#1a1a2e;color:white;text-align:center"><h2 style="font-size:32px;font-weight:800;margin-bottom:40px;opacity:0.9">Our Numbers</h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:24px">${[{n:'500+',l:'Happy Customers'},{n:'100%',l:'Satisfaction'},{n:'5★',l:'Google Rating'},{n:'3+',l:'Years Experience'}].map(s=>`<div><div style="font-size:48px;font-weight:900;color:#6366f1;margin-bottom:8px">${s.n}</div><div style="font-size:14px;opacity:0.7">${s.l}</div></div>`).join('')}</div></section>`,
    'contact-split': (s) => `<section style="display:grid;grid-template-columns:1fr 1fr;gap:0;padding:0;min-height:400px"><div style="padding:60px 40px;background:#6366f1;color:white"><h2 style="font-size:32px;font-weight:800;margin-bottom:20px">Get In Touch</h2><div style="margin-bottom:16px;display:flex;gap:12px;align-items:center"><span style="font-size:20px">📞</span><span>${s.phone||'Your phone'}</span></div><div style="margin-bottom:16px;display:flex;gap:12px;align-items:center"><span style="font-size:20px">📧</span><span>${s.email||'Your email'}</span></div><div style="display:flex;gap:12px;align-items:center"><span style="font-size:20px">📍</span><span>${s.address||'Your address'}</span></div></div><div style="padding:60px 40px;background:#f8f9fa"><h3 style="font-size:22px;font-weight:700;margin-bottom:20px;color:#1a1a2e">Send a Message</h3><div style="margin-bottom:12px"><input type="text" placeholder="Name" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none"></div><div style="margin-bottom:12px"><input type="tel" placeholder="Phone" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;outline:none"></div><div style="margin-bottom:16px"><textarea placeholder="Message" style="width:100%;padding:10px 14px;border:1px solid #ddd;border-radius:6px;font-size:14px;height:90px;resize:none;outline:none"></textarea></div><button style="width:100%;padding:12px;background:#6366f1;color:white;border:none;border-radius:8px;font-size:15px;font-weight:600;cursor:pointer">Send</button></div></section>`,
    'footer-minimal': (s) => `<footer style="background:#1a1a2e;color:white;padding:32px 40px;text-align:center"><p style="opacity:0.7;font-size:14px">© ${new Date().getFullYear()} ${s.siteName||'Your Site'}. All rights reserved.</p></footer>`,
    'footer-4col'  : (s) => `<footer style="background:#1a1a2e;color:white;padding:60px 40px 20px"><div style="display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:40px"><div><h3 style="font-size:20px;font-weight:700;margin-bottom:12px">${s.siteName||'Your Brand'}</h3><p style="opacity:0.6;font-size:14px;line-height:1.6">${s.tagline||'Your tagline here'}</p></div><div><h4 style="font-weight:600;margin-bottom:12px">Quick Links</h4><div style="display:flex;flex-direction:column;gap:8px;font-size:14px;opacity:0.7"><a href="/" style="color:white;text-decoration:none">Home</a><a href="/contact.html" style="color:white;text-decoration:none">Contact</a></div></div><div><h4 style="font-weight:600;margin-bottom:12px">Contact</h4><div style="font-size:13px;opacity:0.7;line-height:2">${s.phone||''}<br>${s.email||''}</div></div><div><h4 style="font-weight:600;margin-bottom:12px">Follow Us</h4><div style="display:flex;gap:10px">${s.instagram?`<a href="${s.instagram}" style="background:rgba(255,255,255,0.1);padding:8px;border-radius:6px;text-decoration:none">📸</a>`:''}</div></div></div><div style="border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;text-align:center;font-size:13px;opacity:0.5">© ${new Date().getFullYear()} ${s.siteName||'Your Site'}. All rights reserved.</div></footer>`,
  };

  let iframe, iframeDoc, currentPage = '', currentHtml = '';
  let siteSettings = {};
  let autoSaveTimer;

  async function init() {
    iframe = document.getElementById('editor-iframe');
    if (!iframe) return;
    iframe.onload = onIframeLoad;
    await loadSiteSettings();
    await loadPageList();
    setupAutosave();
  }

  async function loadSiteSettings() {
    try { siteSettings = await API.get('/api/admin/settings'); } catch {}
  }

  async function loadPageList() {
    try {
      const data = await API.get('/api/admin/pages');
      const sel = document.getElementById('page-selector');
      if (!sel) return;
      const pages = data.pages || [];
      sel.innerHTML = pages.map(p => `<option value="${p}">${p}</option>`).join('');
      if (pages.length) loadPageForEditing(pages[0]);
    } catch { Toast.error('Failed to load pages'); }
  }

  async function loadPageForEditing(filename) {
    if (!filename) return;
    currentPage = filename;
    try {
      const data = await API.get('/api/admin/page-content?filename=' + encodeURIComponent(filename));
      currentHtml = data.html || '';
      injectIntoIframe(currentHtml);
      History.reset();
      renderLayers();
      setAutosaveStatus('saved');
    } catch { Toast.error('Failed to load page'); }
  }

  function injectIntoIframe(html) {
    if (!iframe) return;
    if (!html) html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><base href="/"><link rel="stylesheet" href="/styles.css"><script src="/site-settings.js"><\/script></head><body style="min-height:200px"></body></html>';
    // Inject <base href="/"> so relative paths (styles.css, images, etc.) resolve correctly in srcdoc
    html = html.replace(/(<head[^>]*>)/i, '$1<base href="/">');
    iframe.srcdoc = html;
  }

  function onIframeLoad() {
    try {
      iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
      injectEditorStyles();
      makeEditable();
      renderLayers();
    } catch {}
  }

  function injectEditorStyles() {
    if (!iframeDoc) return;
    const style = iframeDoc.createElement('style');
    style.id = 'jmd-editor-styles';
    style.textContent = `
      .jmd-block { position: relative; transition: outline 0.15s; }
      .jmd-block:hover { outline: 1px dashed rgba(99,102,241,0.5); }
      .jmd-block.selected { outline: 2px solid #6366f1 !important; outline-offset: 3px; }
      [contenteditable]:focus { outline: none !important; }
      body { min-height: 200px; }
    `;
    iframeDoc.head.appendChild(style);
  }

  function makeEditable() {
    if (!iframeDoc) return;
    iframeDoc.querySelectorAll('.jmd-block').forEach(el => bindElement(el));
    iframeDoc.body.addEventListener('click', (e) => {
      if (e.target === iframeDoc.body) deselectAll();
    });
  }

  function bindElement(el) {
    el.addEventListener('click', (e) => {
      e.stopPropagation();
      selectElement(el);
    });
    el.addEventListener('dblclick', (e) => {
      const editable = e.target.closest('[contenteditable]');
      if (editable) { editable.contentEditable = 'true'; editable.focus(); }
    });
    el.addEventListener('blur', (e) => {
      if (e.target.contentEditable === 'true') {
        e.target.contentEditable = 'false';
        saveHistorySnapshot();
      }
    }, true);
  }

  let selectedEl = null;

  function selectElement(el) {
    deselectAll();
    selectedEl = el;
    el.classList.add('selected');
    showProperties(el);
    renderLayers();
  }

  function deselectAll() {
    iframeDoc?.querySelectorAll('.selected').forEach(e => e.classList.remove('selected'));
    selectedEl = null;
    const panel = document.getElementById('props-right-panel');
    if (panel) panel.innerHTML = `<div class="props-empty"><div class="icon">🎯</div><p>Click any element in the canvas to edit its properties</p></div>`;
  }

  function showProperties(el) {
    const panel = document.getElementById('props-right-panel');
    if (!panel) return;
    const cs = el.style;

    // Detect if selected element is or contains an <img>
    const imgEl = (el.tagName === 'IMG') ? el : el.querySelector('img');
    const imgSection = imgEl ? `
      <div class="prop-section">
        <div class="prop-section-header">🖼 Image <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:6px">
            <span class="prop-label" style="width:auto">Image URL / Path</span>
            <input class="prop-input" type="text" id="img-src-input" placeholder="/public/uploads/photo.jpg"
              value="${imgEl.getAttribute('src') || ''}"
              oninput="Editor.setImgSrc(this.value)" style="width:100%">
          </div>
          <div class="prop-row" style="flex-direction:column;align-items:flex-start;gap:6px">
            <span class="prop-label" style="width:auto">Alt Text</span>
            <input class="prop-input" type="text" id="img-alt-input" placeholder="Describe the image"
              value="${imgEl.getAttribute('alt') || ''}"
              oninput="Editor.setImgAlt(this.value)" style="width:100%">
          </div>
          <div class="prop-row" style="margin-top:4px">
            <label class="btn btn-sm btn-secondary w-full" style="cursor:pointer;text-align:center">
              📁 Upload Image
              <input type="file" accept="image/*" style="display:none"
                onchange="Editor.uploadImgFile(this)">
            </label>
          </div>
          <div class="prop-row">
            <button class="btn btn-sm btn-secondary w-full" onclick="Editor.openMediaPicker()">🖼 Browse Media</button>
          </div>
        </div>
      </div>` : '';

    panel.innerHTML = imgSection + `
      <div class="prop-section">
        <div class="prop-section-header" onclick="this.parentElement.classList.toggle('collapsed')">📐 Size &amp; Position <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-row"><span class="prop-label">Width</span><input class="prop-input" type="text" placeholder="auto" value="${cs.width||''}" oninput="Editor.setElStyle('width',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Max-W</span><input class="prop-input" type="text" placeholder="100%" value="${cs.maxWidth||''}" oninput="Editor.setElStyle('maxWidth',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Padding</span><input class="prop-input" type="text" placeholder="0" value="${cs.padding||''}" oninput="Editor.setElStyle('padding',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Margin</span><input class="prop-input" type="text" placeholder="0" value="${cs.margin||''}" oninput="Editor.setElStyle('margin',this.value)"></div>
        </div>
      </div>
      <div class="prop-section">
        <div class="prop-section-header" onclick="this.parentElement.classList.toggle('collapsed')">🎨 Colors <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-row"><span class="prop-label">Background</span><input type="color" class="prop-color" value="#ffffff" oninput="Editor.setElStyle('background',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Bg Gradient</span><input class="prop-input" type="text" placeholder="linear-gradient(…)" oninput="Editor.setElStyle('backgroundImage',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Text Color</span><input type="color" class="prop-color" value="#333333" oninput="Editor.setElStyle('color',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Opacity</span><input type="range" class="prop-slider" min="0" max="1" step="0.05" value="${cs.opacity||1}" oninput="Editor.setElStyle('opacity',this.value)"></div>
        </div>
      </div>
      <div class="prop-section">
        <div class="prop-section-header" onclick="this.parentElement.classList.toggle('collapsed')">✍️ Typography <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-row"><span class="prop-label">Font Size</span><input class="prop-input" type="text" placeholder="16px" oninput="Editor.setElStyle('fontSize',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Weight</span>
            <select class="prop-select" onchange="Editor.setElStyle('fontWeight',this.value)">
              ${[300,400,500,600,700,800,900].map(w => `<option ${cs.fontWeight==w?'selected':''}>${w}</option>`).join('')}
            </select>
          </div>
          <div class="prop-row"><span class="prop-label">Align</span>
            <div class="prop-btn-row">
              ${['left','center','right'].map(a => `<button class="prop-btn" onclick="Editor.setElStyle('textAlign','${a}')">${a === 'left' ? '⬅' : a === 'center' ? '⬛' : '➡'}</button>`).join('')}
            </div>
          </div>
          <div class="prop-row"><span class="prop-label">Line-H</span><input class="prop-input" type="text" placeholder="1.6" oninput="Editor.setElStyle('lineHeight',this.value)"></div>
        </div>
      </div>
      <div class="prop-section">
        <div class="prop-section-header" onclick="this.parentElement.classList.toggle('collapsed')">🔲 Border <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-row"><span class="prop-label">Radius</span><input class="prop-input" type="text" placeholder="0px" oninput="Editor.setElStyle('borderRadius',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Border</span><input class="prop-input" type="text" placeholder="1px solid #eee" oninput="Editor.setElStyle('border',this.value)"></div>
          <div class="prop-row"><span class="prop-label">Shadow</span><input class="prop-input" type="text" placeholder="4px 4px 20px rgba(0,0,0,0.1)" oninput="Editor.setElStyle('boxShadow',this.value)"></div>
        </div>
      </div>
      <div class="prop-section">
        <div class="prop-section-header" onclick="this.parentElement.classList.toggle('collapsed')">⚡ Actions <span class="caret">▾</span></div>
        <div class="prop-section-body">
          <div class="prop-2col">
            <button class="btn btn-sm btn-secondary" onclick="Editor.duplicateEl()">Duplicate</button>
            <button class="btn btn-sm btn-danger" onclick="Editor.deleteEl()">Delete</button>
            <button class="btn btn-sm btn-secondary" onclick="Editor.moveUp()">↑ Up</button>
            <button class="btn btn-sm btn-secondary" onclick="Editor.moveDown()">↓ Down</button>
          </div>
          <div style="margin-top:8px">
            <button class="btn btn-sm btn-secondary w-full" onclick="Editor.promptEditHtml()">💻 Edit HTML</button>
          </div>
        </div>
      </div>
    `;
  }

  // ── Image helpers ──
  function getSelectedImg() {
    if (!selectedEl) return null;
    return (selectedEl.tagName === 'IMG') ? selectedEl : selectedEl.querySelector('img');
  }

  function setImgSrc(src) {
    const img = getSelectedImg();
    if (!img) return;
    img.src = src;
    saveHistorySnapshot();
  }

  function setImgAlt(alt) {
    const img = getSelectedImg();
    if (!img) return;
    img.alt = alt;
    saveHistorySnapshot();
  }

  function uploadImgFile(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64data = e.target.result;
      try {
        // Upload to server media
        const res = await API.post('/api/admin/media/upload', {
          filename: file.name,
          base64data,
          folder: ''
        });
        if (res.url) {
          setImgSrc(res.url);
          const srcInput = document.getElementById('img-src-input');
          if (srcInput) srcInput.value = res.url;
          Toast.success('Image uploaded!');
        }
      } catch {
        // Fallback: use data URL directly
        setImgSrc(base64data);
        const srcInput = document.getElementById('img-src-input');
        if (srcInput) srcInput.value = base64data;
        Toast.info('Image applied (not saved to server)');
      }
    };
    reader.readAsDataURL(file);
  }

  function openMediaPicker() {
    window.open('/admin/media.html', '_blank', 'width=900,height=600');
    Toast.info('Copy the image URL from Media Manager and paste it into the Image URL field');
  }

  function setElStyle(prop, val) {
    if (!selectedEl) return;
    selectedEl.style[prop] = val;
    setAutosaveStatus('unsaved');
    scheduleAutosave();
  }

  function insertElement(type) {
    if (!iframeDoc) { Toast.warning('Load a page first'); return; }
    const elData = ELEMENTS[type];
    if (!elData) return;
    const wrapper = iframeDoc.createElement('div');
    wrapper.className = 'jmd-block';
    wrapper.dataset.type = type;
    wrapper.innerHTML = elData.html;
    iframeDoc.body.appendChild(wrapper);
    bindElement(wrapper);
    selectElement(wrapper);
    saveHistorySnapshot();
    renderLayers();
    scrollIntoView(wrapper);
    Toast.success(`${elData.label} added`);
  }

  function scrollIntoView(el) {
    try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {}
  }

  function insertTemplate(key) {
    if (!iframeDoc) { Toast.warning('Load a page first'); return; }
    const fn = TEMPLATES[key];
    if (!fn) return;
    const html = typeof fn === 'function' ? fn(siteSettings) : fn;
    const wrapper = iframeDoc.createElement('div');
    wrapper.className = 'jmd-block';
    wrapper.dataset.template = key;
    wrapper.innerHTML = html;
    iframeDoc.body.appendChild(wrapper);
    bindElement(wrapper);
    selectElement(wrapper);
    saveHistorySnapshot();
    renderLayers();
    scrollIntoView(wrapper);
    Toast.success('Section added');
  }

  function duplicateEl() {
    if (!selectedEl) return;
    const clone = selectedEl.cloneNode(true);
    selectedEl.after(clone);
    bindElement(clone);
    selectElement(clone);
    saveHistorySnapshot();
    renderLayers();
  }

  function deleteEl() {
    if (!selectedEl) return;
    if (!confirm('Delete this element?')) return;
    selectedEl.remove();
    selectedEl = null;
    saveHistorySnapshot();
    renderLayers();
    const panel = document.getElementById('props-right-panel');
    if (panel) panel.innerHTML = `<div class="props-empty"><div class="icon">🎯</div><p>Click any element</p></div>`;
  }

  function moveUp() {
    if (!selectedEl?.previousElementSibling) return;
    selectedEl.previousElementSibling.before(selectedEl);
    saveHistorySnapshot();
    renderLayers();
  }

  function moveDown() {
    if (!selectedEl?.nextElementSibling) return;
    selectedEl.nextElementSibling.after(selectedEl);
    saveHistorySnapshot();
    renderLayers();
  }

  function promptEditHtml() {
    if (!selectedEl) return;
    const input = document.getElementById('custom-html-input');
    if (input) input.value = selectedEl.outerHTML;
    document.getElementById('html-modal')?.classList.add('open');
  }

  function insertCustomHTML() {
    const input = document.getElementById('custom-html-input');
    if (!input?.value) return;
    if (!selectedEl) { insertRawHTML(input.value); }
    else {
      const tmp = iframeDoc.createElement('div');
      tmp.innerHTML = input.value;
      selectedEl.replaceWith(tmp.firstChild || selectedEl);
      const newEl = selectedEl;
      if (newEl.classList) { newEl.classList.add('jmd-block'); bindElement(newEl); selectElement(newEl); }
    }
    closeModal('html-modal');
    saveHistorySnapshot();
  }

  function insertRawHTML(html) {
    if (!iframeDoc) return;
    const wrapper = iframeDoc.createElement('div');
    wrapper.className = 'jmd-block';
    wrapper.innerHTML = html;
    iframeDoc.body.appendChild(wrapper);
    bindElement(wrapper);
    selectElement(wrapper);
    saveHistorySnapshot();
    renderLayers();
  }

  function saveHistorySnapshot() {
    if (!iframeDoc) return;
    History.push(getFullHTML());
    setAutosaveStatus('unsaved');
    scheduleAutosave();
  }

  function getFullHTML() {
    if (!iframeDoc) return currentHtml;
    const clone = iframeDoc.documentElement.cloneNode(true);
    const style = clone.querySelector('#jmd-editor-styles');
    if (style) style.remove();
    clone.querySelectorAll('.selected,.jmd-block').forEach(el => {
      el.classList.remove('selected');
    });
    return '<!DOCTYPE html>' + clone.outerHTML;
  }

  function undoAction() {
    const html = History.undo();
    if (html) { currentHtml = html; injectIntoIframe(html); Toast.info('Undo'); }
  }

  function redoAction() {
    const html = History.redo();
    if (html) { currentHtml = html; injectIntoIframe(html); Toast.info('Redo'); }
  }

  function setDevice(device) {
    const frame = document.getElementById('device-frame');
    if (!frame) return;
    frame.className = 'device-frame ' + device;
    document.querySelectorAll('[data-device]').forEach(b => b.classList.toggle('active', b.dataset.device === device));
  }

  function togglePreview() {
    const style = iframeDoc?.querySelector('#jmd-editor-styles');
    if (style) {
      const hidden = style.textContent.includes('display:none');
      if (hidden) { style.textContent = style.textContent.replace('.jmd-block{display:none}',''); Toast.info('Edit mode'); }
      else { style.textContent += '.jmd-block:hover{outline:none!important}'; Toast.success('Preview mode'); }
    }
  }

  async function publishChanges() {
    if (!currentPage) { Toast.warning('No page loaded'); return; }
    const btn = document.getElementById('btn-publish');
    if (btn) { btn.textContent = '⏳ Publishing…'; btn.disabled = true; }
    try {
      const html = getFullHTML();
      await API.post('/api/admin/save-page', { filename: currentPage, html });
      currentHtml = html;
      History.push(html);
      setAutosaveStatus('saved');
      Toast.success(`${currentPage} published!`);
    } catch { Toast.error('Publish failed'); }
    if (btn) { btn.textContent = '🚀 Publish'; btn.disabled = false; }
  }

  function scheduleAutosave() {
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(async () => {
      if (!currentPage) return;
      try {
        await API.post('/api/admin/save-page', { filename: currentPage, html: getFullHTML() });
        setAutosaveStatus('saved');
      } catch {}
    }, 30000);
  }

  function setupAutosave() {
    setInterval(() => {
      if (currentPage && document.getElementById('view-editor')?.classList.contains('active')) {
        scheduleAutosave();
      }
    }, 60000);
  }

  function setAutosaveStatus(status) {
    const dot = document.getElementById('autosave-dot');
    const text = document.getElementById('autosave-text');
    if (dot) dot.className = 'autosave-dot' + (status === 'saving' ? ' saving' : '');
    if (text) text.textContent = status === 'saved' ? 'All saved' : status === 'unsaved' ? 'Unsaved changes' : 'Saving…';
  }

  function renderLayers() {
    const el = document.getElementById('editor-layers');
    if (!el || !iframeDoc) return;
    const blocks = iframeDoc.querySelectorAll('.jmd-block');
    if (!blocks.length) { el.innerHTML = '<div style="padding:12px;color:var(--text3);font-size:12px">No blocks yet. Add elements from the left panel.</div>'; return; }
    el.innerHTML = [...blocks].map((b, i) => {
      const type = b.dataset.type || b.dataset.template || b.tagName.toLowerCase();
      const icon = ELEMENTS[type]?.icon || '▭';
      return `
        <div class="layer-item ${b === selectedEl ? 'selected' : ''}" onclick="Editor.selectLayerEl(${i})">
          <span class="layer-icon">${icon}</span>
          <span class="layer-name">${type}-${i + 1}</span>
          <div class="layer-actions">
            <button onclick="event.stopPropagation();Editor.selectLayerEl(${i});Editor.moveUp()" title="Move up">↑</button>
            <button onclick="event.stopPropagation();Editor.selectLayerEl(${i});Editor.deleteEl()" title="Delete" style="color:var(--danger)">🗑</button>
          </div>
        </div>
      `;
    }).join('');
  }

  function selectLayerEl(index) {
    if (!iframeDoc) return;
    const blocks = iframeDoc.querySelectorAll('.jmd-block');
    if (blocks[index]) {
      selectElement(blocks[index]);
      scrollIntoView(blocks[index]);
    }
  }

  async function loadVersions() {
    if (!currentPage) return;
    try {
      const data = await API.get('/api/admin/versions?filename=' + encodeURIComponent(currentPage));
      const list = document.getElementById('versions-list');
      if (!list) return;
      const versions = data.versions || [];
      list.innerHTML = versions.length ? versions.map(v => `
        <div class="version-item">
          <span class="version-time">🕐 ${v.time}</span>
          <button class="version-btn" onclick="Editor.restoreVersion('${v.id}')">Restore</button>
        </div>
      `).join('') : '<div class="props-empty"><p>No versions yet</p></div>';
    } catch { Toast.error('Failed to load history'); }
  }

  async function restoreVersion(versionId) {
    if (!confirm('Restore this version? Current changes will be overwritten.')) return;
    try {
      await API.post('/api/admin/restore-version', { filename: currentPage, versionId });
      await loadPageForEditing(currentPage);
      Toast.success('Version restored!');
    } catch { Toast.error('Restore failed'); }
  }

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (!document.getElementById('view-editor')?.classList.contains('active')) return;
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'z': e.preventDefault(); undoAction(); break;
        case 'y': e.preventDefault(); redoAction(); break;
        case 's': e.preventDefault(); publishChanges(); break;
      }
    }
    if (e.key === 'Delete' && selectedEl && !iframeDoc?.activeElement?.isContentEditable) deleteEl();
    if (e.key === 'Escape') deselectAll();
  });

  return {
    init, loadPageForEditing, insertElement, insertTemplate,
    setElStyle, duplicateEl, deleteEl, moveUp, moveDown,
    setDevice, togglePreview, publishChanges, undoAction, redoAction,
    renderLayers, selectLayerEl, loadVersions, restoreVersion,
    promptEditHtml, insertCustomHTML, showProperties,
    setImgSrc, setImgAlt, uploadImgFile, openMediaPicker
  };
})();

document.addEventListener('DOMContentLoaded', () => Editor.init());

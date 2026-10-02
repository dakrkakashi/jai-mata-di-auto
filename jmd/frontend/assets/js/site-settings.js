/**
 * site-settings.js — JMD Live Site Customizer
 * Reads saved settings from localStorage and applies them to the page.
 * Loaded at the bottom of every site page.
 */
(function () {
    'use strict';

    const LS_KEY = 'jmd_site_settings';

    // --- BEGIN AUTO-GENERATED CONFIG ---
    window.JMD_CONFIG = {
    "siteName": "Jai Mata Di Auto",
    "tagline": "Authorized Ampere EV Dealer — Loni",
    "phone": "+91-9890202091",
    "address": "Loni Kh., Ahilyanagar, Maharashtra"
};
    // --- END AUTO-GENERATED CONFIG ---

    // ── LOAD & MERGE ──────────────────────────────────────────────────────────
    let settings = Object.assign({}, window.JMD_CONFIG.settings);
    try {
        const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
        settings = Object.assign(settings, saved);
    } catch (e) { /* ignore */ }

    // ── CSS VARIABLES ─────────────────────────────────────────────────────────
    function applyCSS() {
        const root = document.documentElement;
        root.style.setProperty('--color-primary', settings.colorPrimary);
        root.style.setProperty('--color-accent',  settings.colorAccent);
        root.style.setProperty('--green',          settings.colorPrimary); // compat
        // Font
        if (settings.fontFamily && settings.fontFamily !== window.JMD_CONFIG.settings.fontFamily) {
            root.style.setProperty('--font-main', settings.fontFamily);
        }
    }

    // ── HEAD (title / meta) ───────────────────────────────────────────────────
    function applyHead() {
        if (settings.siteTitle && document.title) {
            document.title = settings.siteTitle;
        }
        
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && settings.metaDescription) {
            metaDesc.setAttribute('content', settings.metaDescription);
        }

        if (settings.metaKeywords) {
            let metaKey = document.querySelector('meta[name="keywords"]');
            if (!metaKey) {
                metaKey = document.createElement('meta');
                metaKey.name = "keywords";
                document.head.appendChild(metaKey);
            }
            metaKey.setAttribute('content', settings.metaKeywords);
        }
    }

    // ── ANNOUNCEMENT BAR ──────────────────────────────────────────────────────
    function applyAnnouncement() {
        const bar = document.querySelector('.announcement-bar span');
        if (bar && settings.announcementText) {
            bar.textContent = settings.announcementText;
        }
    }

    // ── HERO ──────────────────────────────────────────────────────────────────
    let activeSlideIndex = 0;
    
    window.moveHeroSlide = function(dir) {
        const slider = document.getElementById('heroSlider');
        if (!slider || !settings.heroSlides || !settings.heroSlides.length) return;
        
        activeSlideIndex += dir;
        if (activeSlideIndex < 0) activeSlideIndex = settings.heroSlides.length - 1;
        if (activeSlideIndex >= settings.heroSlides.length) activeSlideIndex = 0;
        
        const slideWidth = slider.clientWidth;
        slider.scrollTo({ left: activeSlideIndex * slideWidth, behavior: 'smooth' });
        
        const dots = document.querySelectorAll('.slider-dot');
        dots.forEach((dot, i) => {
            dot.classList.toggle('active', i === activeSlideIndex);
        });
    };

    function applyHero() {
        // Only run if we are on the homepage (have a heroSlider)
        const slider = document.getElementById('heroSlider');
        if (!slider) {
            // Fallback for other pages using the older structure
            const eyebrow = document.querySelector('.hero .eyebrow');
            if (eyebrow) eyebrow.textContent = settings.heroEyebrow || '';
            const h1 = document.querySelector('.hero h1');
            if (h1) h1.textContent = settings.heroHeadline || '';
            const para = document.querySelector('.hero-copy > p');
            if (para) para.textContent = settings.heroParagraph || '';
            const pills = document.querySelectorAll('.hero-proof-pill');
            if (pills[0]) pills[0].textContent = settings.heroPill1 || '';
            if (pills[1]) pills[1].textContent = settings.heroPill2 || '';
            if (pills[2]) pills[2].textContent = settings.heroPill3 || '';
            return;
        }

        // New Array-based rendering
        const slides = settings.heroSlides || [];
        if (slides.length === 0) return; // Keep static placeholder if empty
        
        slider.textContent = ''; // clear static ones
        const dotsContainer = document.getElementById('heroDots');
        if (dotsContainer) dotsContainer.textContent = '';

        slides.forEach((slide, idx) => {
            const isActive = idx === 0 ? 'active' : '';
            if (dotsContainer) {
                const dotBtn = document.createElement('button');
                dotBtn.className = 'slider-dot' + (isActive ? ' active' : '');
                dotBtn.addEventListener('click', () => moveHeroSlide(idx - activeSlideIndex));
                dotBtn.setAttribute('aria-label', `Go to slide ${idx+1}`);
                dotsContainer.appendChild(dotBtn);
            }

            const slideEl = document.createElement('div');
            slideEl.className = 'hero-slide';

            const container = document.createElement('div');
            container.className = 'container hero-shell';

            const copy = document.createElement('div');
            copy.className = 'hero-copy';

            const eyebrow = document.createElement('span');
            eyebrow.className = 'eyebrow reveal-up';
            eyebrow.textContent = slide.eyebrow || '';
            copy.appendChild(eyebrow);

            const h1 = document.createElement('h1');
            h1.className = 'reveal-up gradient-text';
            h1.textContent = slide.headline || '';
            copy.appendChild(h1);

            const p = document.createElement('p');
            p.className = 'reveal-up';
            p.textContent = slide.paragraph || '';
            copy.appendChild(p);

            const chipRow = document.createElement('div');
            chipRow.className = 'hero-chip-row reveal-up';
            ['pill1', 'pill2', 'pill3'].forEach(k => {
                if (slide[k]) {
                    const pill = document.createElement('span');
                    pill.className = 'hero-proof-pill';
                    pill.setAttribute('data-float', 'true');
                    pill.textContent = slide[k];
                    chipRow.appendChild(pill);
                }
            });
            copy.appendChild(chipRow);

            const btns = document.createElement('div');
            btns.className = 'hero-btns reveal-up';

            const primaryBtn = document.createElement('a');
            primaryBtn.href = (window.safeUrl ? window.safeUrl(slide.buttonLink) : slide.buttonLink) || '#';
            primaryBtn.className = 'btn-primary';
            primaryBtn.setAttribute('data-bounce', 'true');
            primaryBtn.textContent = slide.buttonText || 'Book Test Ride';
            btns.appendChild(primaryBtn);

            const waBtn = document.createElement('a');
            waBtn.href = 'https://wa.me/919890202091';
            waBtn.target = '_blank';
            waBtn.rel = 'noopener noreferrer';
            waBtn.className = 'btn-outline-dark';
            waBtn.textContent = 'WhatsApp Enquiry';
            btns.appendChild(waBtn);

            copy.appendChild(btns);
            container.appendChild(copy);

            const mediaWrap = document.createElement('div');
            mediaWrap.className = 'hero-media reveal-up';
            const frame = document.createElement('div');
            frame.className = 'hero-media-frame is-product-shot';
            frame.setAttribute('data-shine', 'true');
            const img = document.createElement('img');
            img.src = (window.safeUrl ? window.safeUrl(slide.image) : slide.image) || '';
            img.alt = 'Ampere Scooter';
            img.onerror = function() { this.src = 'images/nexus/Nexus_Black.webp'; };
            frame.appendChild(img);
            mediaWrap.appendChild(frame);

            const accent = document.createElement('div');
            accent.className = 'hero-media-accent';
            const blob1 = document.createElement('div');
            blob1.className = 'accent-blob accent-blob-1';
            const blob2 = document.createElement('div');
            blob2.className = 'accent-blob accent-blob-2';
            accent.appendChild(blob1);
            accent.appendChild(blob2);
            mediaWrap.appendChild(accent);

            container.appendChild(mediaWrap);
            slideEl.appendChild(container);
            slider.appendChild(slideEl);
        });

        // Hide navigation if only 1 slide
        if (slides.length <= 1) {
            document.querySelectorAll('.slider-nav').forEach(btn => btn.style.display = 'none');
            if (dotsContainer) dotsContainer.style.display = 'none';
        } else {
            document.querySelectorAll('.slider-nav').forEach(btn => btn.style.display = 'flex');
        }
        
        // Auto-detect scrolling for dots sync
        slider.addEventListener('scroll', () => {
            const slideWidth = slider.clientWidth;
            const newIndex = Math.round(slider.scrollLeft / slideWidth);
            if (newIndex !== activeSlideIndex && newIndex >= 0 && newIndex < slides.length) {
                activeSlideIndex = newIndex;
                const dots = document.querySelectorAll('.slider-dot');
                dots.forEach((dot, i) => {
                    dot.classList.toggle('active', i === activeSlideIndex);
                });
            }
        }, { passive: true });
    }

    // ── DEALER INFO ───────────────────────────────────────────────────────────
    function applyDealer() {
        // Dealer section title
        const dTitle = document.querySelector('.dealer-info-panel h2');
        if (dTitle && settings.dealerName) {
            dTitle.textContent = 'Visit ' + settings.dealerName + ' in Loni';
        }

        // Address
        document.querySelectorAll('.dealer-meta-item').forEach(function(item) {
            const label = item.querySelector('strong');
            if (!label) return;
            const val = item.querySelector('span, a');
            if (label.textContent.trim() === 'Address' && val) {
                val.textContent = settings.dealerAddress;
            }
            if (label.textContent.trim() === 'Phone') {
                const link = item.querySelector('a');
                if (link) {
                    link.textContent = settings.dealerPhone;
                    link.href = 'tel:' + settings.dealerPhone.replace(/[^0-9+]/g,'');
                }
            }
            if (label.textContent.trim() === 'Email') {
                const link = item.querySelector('a');
                if (link) {
                    link.textContent = settings.dealerEmail;
                    link.href = 'mailto:' + settings.dealerEmail;
                }
            }
            if (label.textContent.trim() === 'Hours' && val) {
                val.textContent = '';
                const parts = (settings.dealerHours || '').split('|');
                parts.forEach((p, idx) => {
                    if (idx > 0) val.appendChild(document.createElement('br'));
                    val.appendChild(document.createTextNode(p.trim()));
                });
            }
        });

        // Footer phone / email
        const ftPhone = document.querySelector('.footer-list a[href^="tel"]');
        if (ftPhone) {
            ftPhone.textContent = settings.dealerPhone;
            ftPhone.href = 'tel:' + settings.dealerPhone.replace(/[^0-9+]/g,'');
        }
        const ftEmail = document.querySelector('.footer-list a[href^="mailto"]');
        if (ftEmail) {
            ftEmail.textContent = settings.dealerEmail;
            ftEmail.href = 'mailto:' + settings.dealerEmail;
        }

        // Footer brand copy
        const ftCopy = document.querySelector('.footer-brand-copy');
        if (ftCopy && settings.footerCopy) ftCopy.textContent = settings.footerCopy;

        // Footer brand title
        const ftTitle = document.querySelector('.footer-brand-title');
        if (ftTitle && settings.dealerName) ftTitle.textContent = settings.dealerName;
    }

    // ── WHATSAPP LINKS ────────────────────────────────────────────────────────
    function applyWhatsApp() {
        document.querySelectorAll('a[href*="wa.me"]').forEach(function(a) {
            // Replace the number portion in the URL
            a.href = a.href.replace(/wa\.me\/\d+/, 'wa.me/' + settings.waNumber1);
        });
    }

    // ── MEDIA (Images) ────────────────────────────────────────────────────────
    function applyMedia() {
        let media = Object.assign({}, window.JMD_CONFIG.media);
        try { 
            const saved = JSON.parse(localStorage.getItem('jmd_images'));
            if (saved) media = Object.assign(media, saved);
        } catch(e){}
        
        // Logo
        if (media.logo) {
            document.querySelectorAll('.nav-logo-img, .site-logo, .footer-logo').forEach(img => {
                img.src = media.logo;
            });
        }

        // Hero background
        if (media.hero) {
            const heroWrap = document.querySelector('.hero');
            if (heroWrap) {
                // If there's an existing background image style, replace it, else create one
                heroWrap.style.background = `linear-gradient(to right, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.3) 100%), url(${media.hero}) no-repeat center/cover`;
            }
        }

        // Model Illustrations
        const modelClasses = {
            'nexus': '.product-hero-section.nexus',
            'magnus_ex': '.product-hero-section.magnus-ex',
            'magnus_grand': '.product-hero-section.magnus-grand',
            'magnus_gmax': '.product-hero-section.magnus-gmax',
            'magnus_neo': '.product-hero-section.magnus-neo',
            'reo_80': '.product-hero-section.product-hero-reo80'
        };
        for (const [key, cls] of Object.entries(modelClasses)) {
            if (media[key]) {
                const section = document.querySelector(cls);
                if (section) {
                    const ill = section.querySelector('.product-illustration');
                    if (ill) {
                        ill.textContent = '';
                        const img = document.createElement('img');
                        img.src = (window.safeUrl ? window.safeUrl(media[key]) : media[key]) || '';
                        img.style.cssText = 'width:100%; height:100%; object-fit:contain;';
                        ill.appendChild(img);
                    }
                }
            }
        }

        // Dealer Image
        if (media.dealer) {
            const dealerImg = document.querySelector('.dealer-media-card img');
            if (dealerImg) dealerImg.src = media.dealer;
        }
    }

    // ── PAGES / TEXTS ─────────────────────────────────────────────────────────
    function applyPages() {
        let pages = Object.assign({}, window.JMD_CONFIG.pages);
        try { 
            const saved = JSON.parse(localStorage.getItem('jmd_pages'));
            if (saved) pages = Object.assign(pages, saved);
        } catch(e){}

        if (pages.heroHeadline) {
            const el = document.querySelector('.hero h1');
            if (el) el.textContent = pages.heroHeadline; 
        }
        if (pages.heroSub) {
            const el = document.querySelector('.hero-copy > p');
            if (el) el.textContent = pages.heroSub;
        }

        if (pages.models) {
            const modelMap = {
                'nexus': '.product-hero-section.nexus',
                'magnus_ex': '.product-hero-section.magnus-ex',
                'magnus_grand': '.product-hero-section.magnus-grand',
                'magnus_gmax': '.product-hero-section.magnus-gmax',
                'magnus_neo': '.product-hero-section.magnus-neo',
                'reo_80': '.product-hero-section.product-hero-reo80'
            };
            
            for (const [key, selector] of Object.entries(modelMap)) {
                const conf = pages.models[key];
                if (!conf) continue;
                const section = document.querySelector(selector);
                if (!section) continue;

                const tagline = section.querySelector('.product-tagline');
                if (tagline && conf.tagline) tagline.textContent = conf.tagline;

                const price = section.querySelector('.price-badge');
                if (price) {
                    if (conf.price) { price.textContent = conf.price; price.style.display = ''; }
                    else { price.style.display = 'none'; }
                } else if (conf.price) {
                    // Inject a price badge if it was missing (e.g. Nexus ST originally didn't have one)
                    const pTitle = section.querySelector('.product-tagline');
                    if (pTitle) {
                        const newBadge = document.createElement('div');
                        newBadge.className = 'price-badge';
                        newBadge.textContent = conf.price;
                        pTitle.after(newBadge);
                    }
                }

                const specs = section.querySelectorAll('.product-spec-item');
                if (specs.length >= 4) {
                    if (conf.s1v) specs[0].querySelector('.spec-value').textContent = conf.s1v;
                    if (conf.s1l) specs[0].querySelector('.spec-label').textContent = conf.s1l;
                    
                    if (conf.s2v) specs[1].querySelector('.spec-value').textContent = conf.s2v;
                    if (conf.s2l) specs[1].querySelector('.spec-label').textContent = conf.s2l;
                    
                    if (conf.s3v) specs[2].querySelector('.spec-value').textContent = conf.s3v;
                    if (conf.s3l) specs[2].querySelector('.spec-label').textContent = conf.s3l;
                    
                    if (conf.s4v) specs[3].querySelector('.spec-value').textContent = conf.s4v;
                    if (conf.s4l) specs[3].querySelector('.spec-label').textContent = conf.s4l;
                }
            }
        }

        if (pages.dealer) {
            const panel = document.querySelector('.dealer-info-panel');
            if (panel) {
                const eb = panel.querySelector('.eyebrow');
                if (eb && pages.dealer.eyebrow) eb.textContent = pages.dealer.eyebrow;

                const h2 = panel.querySelector('h2.section-title');
                if (h2 && pages.dealer.headline) h2.textContent = pages.dealer.headline;

                const p = panel.querySelector('p.section-copy');
                if (p && pages.dealer.desc) p.textContent = pages.dealer.desc;
            }
        }
    }

    // ── EXTENSIONS (Toggles) ──────────────────────────────────────────────────
    function applyExtensions() {
        let exts = Object.assign({}, window.JMD_CONFIG.extensions);
        try { 
            const saved = JSON.parse(localStorage.getItem('jmd_extensions'));
            if (saved) exts = Object.assign(exts, saved);
        } catch(e){}

        if (!exts.wa) {
            document.querySelectorAll('.btn-whatsapp').forEach(e => e.style.display = 'none');
            const floatWa = document.querySelector('.floating-wa'); // If exists
            if (floatWa) floatWa.style.display = 'none';
        }
        
        if (!exts.announce) {
            const bar = document.querySelector('.announcement-bar');
            if (bar) bar.style.display = 'none';
        }

        if (exts.bot) {
            // Future placeholder for chatbot script
            // e.g. injectChatbot()
        }

        if (!exts.forms) {
            document.querySelectorAll('form').forEach(f => {
                f.style.display = 'none';
                const msg = document.createElement('p');
                msg.textContent = 'Enquiries are currently closed.';
                msg.style.color = 'var(--muted)';
                f.parentNode.insertBefore(msg, f);
            });
        }
    }

    // ── RUN ALL ───────────────────────────────────────────────────────────────
    function applyAll() {
        applyCSS();
        applyHead();
        applyAnnouncement();
        applyHero();
        applyDealer();
        applyWhatsApp();
        applyMedia();
        applyPages();
        applyExtensions();
    }

    // Run after DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyAll);
    } else {
        applyAll();
    }

    // Expose for live preview reloads
    window.JMD_SETTINGS = settings;
})();

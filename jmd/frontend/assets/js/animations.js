/* =============================================
   ANIMATIONS.JS — Premium Interaction Layer v3
   Custom cursor · Canvas particles · 3D tilt
   Magnetic buttons · Typing · Scroll progress
   ============================================= */

(function () {
    'use strict';

    /* ─── PAGE LOADER ─────────────────────────── */
    const loaderEl = document.getElementById('page-loader');
    window.addEventListener('load', () => {
        setTimeout(() => {
            if (loaderEl) loaderEl.classList.add('loaded');
        }, 800);
    });

    /* ─── SCROLL PROGRESS BAR ─────────────────── */
    const progressBar = document.getElementById('scroll-progress');
    let ticking = false;

    function updateProgress() {
        if (!progressBar) return;
        const docH = document.documentElement.scrollHeight - window.innerHeight;
        const pct  = docH > 0 ? (window.scrollY / docH) * 100 : 0;
        progressBar.style.width = pct + '%';
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (!ticking) { requestAnimationFrame(updateProgress); ticking = true; }
    }, { passive: true });
    updateProgress();

    /* ─── NATIVE SYSTEM CURSOR PRESERVED ─────── */
    const dot  = document.getElementById('custom-cursor');
    const ring = document.getElementById('custom-cursor-ring');
    if (dot) dot.remove();
    if (ring) ring.remove();

    /* ─── REDUCED MOTION CHECK ────────────────── */
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    /* ─── HERO CANVAS PARTICLES ───────────────── */
    const canvas = document.getElementById('hero-canvas');
    if (canvas && !prefersReducedMotion) {
        const ctx = canvas.getContext('2d');
        let W, H, particles = [];

        function resize() {
            const hero = canvas.parentElement;
            W = canvas.width  = hero ? hero.offsetWidth  : window.innerWidth;
            H = canvas.height = hero ? hero.offsetHeight : window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize, { passive: true });

        class Particle {
            constructor() { this.reset(); }
            reset() {
                this.x     = Math.random() * W;
                this.y     = Math.random() * H;
                this.r     = Math.random() * 1.8 + 0.4;
                this.vx    = (Math.random() - 0.5) * 0.4;
                this.vy    = (Math.random() - 0.5) * 0.4;
                this.alpha = Math.random() * 0.5 + 0.15;
                this.color = Math.random() > 0.4 ? '#22c55e' : '#4ade80';
            }
            update() {
                this.x += this.vx;
                this.y += this.vy;
                if (this.x < -5 || this.x > W + 5 || this.y < -5 || this.y > H + 5) this.reset();
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
                ctx.fillStyle = this.color;
                ctx.globalAlpha = this.alpha;
                ctx.fill();
            }
        }

        // Create particles
        for (let i = 0; i < 80; i++) particles.push(new Particle());

        // Connection lines
        function drawConnections() {
            const CONN_DIST = 120;
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const d  = Math.sqrt(dx * dx + dy * dy);
                    if (d < CONN_DIST) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = '#22c55e';
                        ctx.globalAlpha = (1 - d / CONN_DIST) * 0.12;
                        ctx.lineWidth   = 0.8;
                        ctx.stroke();
                    }
                }
            }
        }

        let rafCanvas;
        function animCanvas() {
            ctx.clearRect(0, 0, W, H);
            particles.forEach(p => { p.update(); p.draw(); });
            drawConnections();
            rafCanvas = requestAnimationFrame(animCanvas);
        }

        // Only run when hero is visible
        const heroSection = document.querySelector('.hero');
        if (heroSection && 'IntersectionObserver' in window) {
            const heroIO = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) { if (!rafCanvas) animCanvas(); }
                    else { cancelAnimationFrame(rafCanvas); rafCanvas = null; }
                });
            }, { threshold: 0 });
            heroIO.observe(heroSection);
        } else {
            animCanvas();
        }
    }

    /* ─── TYPING EFFECT ON HERO H1 ───────────── */
    const heroH1 = document.querySelector('.hero-content h1');
    if (heroH1) {
        const phrases = ['Charge Forward.', 'Go Electric.', 'Save More.'];
        const greenSpan = heroH1.querySelector('.text-green');
        if (greenSpan) {
            const words = ['Go Electric.', 'Save ₹38K/yr.', 'Ride Smarter.', 'Zero Emissions.'];
            let wi = 0, ci = 0, deleting = false;

            function typeWord() {
                const word = words[wi];
                if (!deleting) {
                    greenSpan.textContent = word.slice(0, ++ci);
                    if (ci === word.length) { deleting = true; setTimeout(typeWord, 2200); return; }
                } else {
                    greenSpan.textContent = word.slice(0, --ci);
                    if (ci === 0) { deleting = false; wi = (wi + 1) % words.length; setTimeout(typeWord, 400); return; }
                }
                setTimeout(typeWord, deleting ? 45 : 75);
            }

            // Start after hero animation settles
            setTimeout(typeWord, 1500);
        }
    }

    /* ─── EXTENDED SCROLL REVEAL ─────────────── */
    const REVEAL_CLASSES = ['.reveal-up', '.reveal-left', '.reveal-right', '.reveal-scale'];
    const revealClassNames = REVEAL_CLASSES.map(selector => selector.slice(1));

    function addRevealBatch(selector, revealClass = 'reveal-up', staggerStep = 0.08) {
        document.querySelectorAll(selector).forEach((el, index) => {
            if (revealClassNames.some(className => el.classList.contains(className))) return;
            el.classList.add(revealClass);
            if (!el.style.transitionDelay) {
                const delay = Math.min((index % 6) * staggerStep, 0.4);
                el.style.transitionDelay = delay.toFixed(2) + 's';
            }
        });
    }

    addRevealBatch('.section-header');
    addRevealBatch('.contact-hero .container');
    addRevealBatch('.models-hero .container');
    addRevealBatch('.test-ride-hero .container');
    addRevealBatch('.contact-grid > *');
    addRevealBatch('.cta-buttons-col a');
    addRevealBatch('.all-models-grid > *', 'reveal-scale', 0.06);
    addRevealBatch('.dealer-hero-inner > *');
    addRevealBatch('.dealer-gallery-large > *', 'reveal-scale');
    addRevealBatch('.dealer-gallery-strip > *', 'reveal-up', 0.06);
    addRevealBatch('.dealer-wrapper > *');
    addRevealBatch('.dealer-services-grid > *', 'reveal-up', 0.06);
    addRevealBatch('.tr-steps li', 'reveal-up', 0.06);
    addRevealBatch('.showroom-info-box', 'reveal-scale');
    addRevealBatch('.test-ride-grid > *');
    addRevealBatch('.trust-grid > *', 'reveal-up', 0.06);
    addRevealBatch('.lineup-grid > *', 'reveal-up', 0.06);
    addRevealBatch('.gmax-hero-intro');
    addRevealBatch('.gmax-banner-frame', 'reveal-scale');
    addRevealBatch('.gmax-hero-actions > *', 'reveal-up', 0.05);
    addRevealBatch('.model-page-hero .mph-text', 'reveal-left');
    addRevealBatch('.model-page-hero .mph-visual', 'reveal-right');
    addRevealBatch('.gmax-feature-tabs > *', 'reveal-up', 0.04);
    addRevealBatch('.gmax-feature-stage > *');
    addRevealBatch('.gallery-grid-2col > *', 'reveal-scale');
    addRevealBatch('.gallery-grid-main > *', 'reveal-scale', 0.05);
    addRevealBatch('.gallery-grid-2col-mt1 > *', 'reveal-up', 0.05);
    addRevealBatch('.gallery-grid-3col > *', 'reveal-up', 0.05);
    addRevealBatch('.gallery-grid-colors > *', 'reveal-up', 0.05);
    addRevealBatch('.colour-showcase > *');
    addRevealBatch('.colour-showcase-swatches > *', 'reveal-scale', 0.04);
    addRevealBatch('.colours-flex > *', 'reveal-up', 0.05);
    addRevealBatch('.colours-flex-mt15 > *', 'reveal-up', 0.05);
    addRevealBatch('.highlights-flex > *', 'reveal-scale', 0.04);
    addRevealBatch('.features-big-grid > *', 'reveal-up', 0.06);
    addRevealBatch('.price-emi-grid > *');
    addRevealBatch('.section-cta .container');
    addRevealBatch('.full-specs-section .container');
    addRevealBatch('.brochure-spotlight-grid > *');
    addRevealBatch('.brochure-copy-stack .brochure-info-card', 'reveal-up', 0.06);
    addRevealBatch('.brochure-mini-meta .brochure-mini-pill', 'reveal-scale', 0.05);
    addRevealBatch('.brochure-download-bar', 'reveal-up');

    const allRevealEls = document.querySelectorAll(REVEAL_CLASSES.join(','));

    if ('IntersectionObserver' in window && allRevealEls.length > 0) {
        const revealIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealIO.unobserve(entry.target);
                }
            });
        }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });
        allRevealEls.forEach(el => revealIO.observe(el));
    } else {
        allRevealEls.forEach(el => el.classList.add('visible'));
    }

    /* ─── 3D TILT EFFECT ─────────────────────── */
    function applyTilt(el) {
        if (!el) return;
        const STRENGTH = 8;
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top  + rect.height / 2;
            const dx = (e.clientX - cx) / (rect.width  / 2);
            const dy = (e.clientY - cy) / (rect.height / 2);
            const rotX = -dy * STRENGTH;
            const rotY =  dx * STRENGTH;
            el.style.transform = `perspective(1000px) rotateX(${rotX}deg) rotateY(${rotY}deg) scale(1.02)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale(1)';
            el.style.transition = 'transform 0.5s cubic-bezier(0.34,1.56,0.64,1)';
            setTimeout(() => { el.style.transition = ''; }, 500);
        });
    }

    // Apply tilt to key cards across the site
    document.querySelectorAll('.why-card, .testi-card, .model-card-v2, .contact-info-card, .tr-form-card, .ds-card, .feature-big-card, .price-emi-grid > div, .brochure-info-card, .brochure-visual-card, .lineup-card, .trust-card, .gallery-grid-3col > div').forEach(applyTilt);

    /* ─── MAGNETIC BUTTON EFFECT ─────────────── */
    function applyMagnetic(el, strength = 0.35) {
        if (!el) return;
        el.addEventListener('mousemove', e => {
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width  / 2;
            const cy = rect.top  + rect.height / 2;
            const dx = (e.clientX - cx) * strength;
            const dy = (e.clientY - cy) * strength;
            el.style.transform = `translate(${dx}px, ${dy}px) scale(1.03)`;
        });
        el.addEventListener('mouseleave', () => {
            el.style.transform = '';
        });
    }

    document.querySelectorAll('.btn-nav-cta, .btn-primary, .btn-whatsapp').forEach(btn => {
        applyMagnetic(btn);
        // Ripple on click
        btn.addEventListener('click', function (e) {
            const rect = this.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const size = Math.max(rect.width, rect.height) * 2;
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            ripple.style.cssText = `width:${size}px;height:${size}px;left:${x - size/2}px;top:${y - size/2}px`;
            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 650);
        });
    });

    /* ─── RANGE SLIDER FILL (SAVINGS) ────────── */
    const slider = document.getElementById('kmSlider');
    if (slider) {
        function updateSliderFill() {
            const min = +slider.min, max = +slider.max, val = +slider.value;
            const pct = ((val - min) / (max - min)) * 100;
            slider.style.setProperty('--fill', pct + '%');
        }
        slider.addEventListener('input', updateSliderFill);
        updateSliderFill();
    }

    /* ─── FAQ ENHANCED ACCORDION ─────────────── */
    window.toggleFaq = function (btn) {
        const item   = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('open');

        document.querySelectorAll('.faq-item.open').forEach(i => {
            i.classList.remove('open');
            i.style.transform = '';
        });

        if (!isOpen) {
            item.classList.add('open');
            // Subtle bounce
            item.style.transform = 'scale(1.008)';
            setTimeout(() => { item.style.transform = ''; }, 250);
        }
    };

    /* ─── MODEL TAB INDICATOR SLIDER ─────────── */
    const tabsWrap = document.querySelector('.model-tabs');
    const tabs     = document.querySelectorAll('.model-tab');

    if (tabsWrap && tabs.length > 0) {
        // Create indicator
        const indicator = document.createElement('div');
        indicator.className = 'model-tab-indicator';
        tabsWrap.insertBefore(indicator, tabsWrap.firstChild);

        function moveIndicator(tab) {
            if (!tab) return;
            const wr = tabsWrap.getBoundingClientRect();
            const tr = tab.getBoundingClientRect();
            indicator.style.left   = (tr.left - wr.left) + 'px';
            indicator.style.top    = (tr.top  - wr.top ) + 'px';
            indicator.style.width  = tr.width  + 'px';
            indicator.style.height = tr.height + 'px';
        }

        // Init position
        requestAnimationFrame(() => {
            const activeTab = tabsWrap.querySelector('.model-tab.active');
            if (activeTab) moveIndicator(activeTab);
        });

        tabs.forEach(tab => {
            tab.addEventListener('click', () => moveIndicator(tab));
        });
    }

    /* ─── PARALLAX HERO ───────────────────────── */
    const heroSection = document.querySelector('.hero');
    const heroContent = document.querySelector('.hero-content');
    const heroImage   = document.querySelector('.hero-image-area');

    if (heroSection && heroContent && !prefersReducedMotion) {
        let heroRaf;
        window.addEventListener('scroll', () => {
            if (heroRaf) return;
            heroRaf = requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                const limit    = heroSection.offsetHeight;
                if (scrolled < limit) {
                    heroContent.style.transform = `translateY(${scrolled * 0.12}px)`;
                    if (heroImage) heroImage.style.transform = `translateY(${scrolled * 0.06}px)`;
                }
                heroRaf = null;
            });
        }, { passive: true });
    }

    /* ─── ANNOUNCE BAR MARQUEE SCROLL ─────────── */
    const annBar = document.querySelector('.announcement-bar span');
    if (annBar) {
        annBar.style.display = 'inline-block';
        annBar.style.animation = 'marqueeMove 25s linear infinite';

        // Inject marquee keyframe
        const kf = document.createElement('style');
        kf.textContent = `
            @keyframes marqueeMove {
                0%   { transform: translateX(0); }
                100% { transform: translateX(-30%); }
            }
            .announcement-bar { overflow: hidden; white-space: nowrap; }
            .announcement-bar span { padding-right: 80px; }
        `;
        document.head.appendChild(kf);
    }

    /* ─── IMPACT STRIP COUNTER ENHANCED ──────── */
    const impactNums = document.querySelectorAll('.impact-num[data-count]');
    if (impactNums.length > 0 && 'IntersectionObserver' in window) {
        const countIO = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el     = entry.target;
                    const target = parseInt(el.dataset.count, 10);
                    const suffix = el.dataset.suffix || '';
                    const dur    = 2000;
                    const start  = performance.now();

                    (function tick(now) {
                        const t = Math.min((now - start) / dur, 1);
                        const v = Math.floor(easeOutCubic(t) * target);
                        el.textContent = v.toLocaleString('en-IN') + suffix;
                        if (t < 1) requestAnimationFrame(tick);
                        else {
                            el.textContent = target.toLocaleString('en-IN') + suffix;
                            el.classList.add('counted');
                            setTimeout(() => el.classList.remove('counted'), 600);
                        }
                    })(start);

                    countIO.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        impactNums.forEach(el => countIO.observe(el));
    }

    function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

    /* ─── HOVER SOUND FEEL (Haptic-like) ─────── */
    // Subtle micro-animation on hover for cards
    document.querySelectorAll('.parts-card, .spec-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transition = 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)';
        });
        card.addEventListener('mouseleave', () => {
            card.style.transition = '';
        });
    });

    /* ─── MODEL PANEL ENHANCED TRANSITION ────── */
    const modelTabs   = document.querySelectorAll('.model-tab');
    const modelPanels = document.querySelectorAll('.model-panel');

    modelTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            modelTabs.forEach(t => t.classList.remove('active'));
            modelPanels.forEach(p => {
                if (p.classList.contains('active')) {
                    p.style.opacity = '0';
                    p.style.transform = 'translateY(-12px)';
                    setTimeout(() => {
                        p.classList.remove('active');
                        p.style.opacity = '';
                        p.style.transform = '';
                    }, 200);
                }
            });
            tab.classList.add('active');
            setTimeout(() => {
                const targetId = 'panel-' + tab.dataset.model;
                const panel    = document.getElementById(targetId);
                if (panel) panel.classList.add('active');
            }, 200);
        });
    });

    /* ─── SAVINGS RESULT HIGHLIGHT ────────────── */
    const monthlyEl = document.getElementById('monthlySaving');
    const yearlyEl  = document.getElementById('yearlySaving');

    if (slider && monthlyEl && yearlyEl) {
        slider.addEventListener('input', () => {
            [monthlyEl, yearlyEl].forEach(el => {
                if (!el) return;
                el.closest('.result-amount')?.classList.add('updating');
                setTimeout(() => el.closest('.result-amount')?.classList.remove('updating'), 350);
            });
        });
    }

    /* ─── SECTION DIVIDER INJECT ─────────────── */
    document.querySelectorAll('.section-header').forEach(header => {
        const eyebrow = header.querySelector('.section-eyebrow');
        const h2      = header.querySelector('h2');
        if (eyebrow && h2 && !header.querySelector('.section-divider')) {
            const div = document.createElement('div');
            div.className = 'section-divider';
            h2.insertAdjacentElement('afterend', div);
        }
    });

    /* ─── STAGGER REVEAL-UP ON GRIDS ─────────── */
    // Add reveal-up to grid items that don't have it
    document.querySelectorAll('.why-grid .why-card, .testimonials-grid .testi-card, .parts-grid .parts-card').forEach(card => {
        if (!card.classList.contains('reveal-up')) {
            card.classList.add('reveal-up');
        }
    });

    /* ─── SMOOTH FORM VALIDATION FEEDBACK ────── */
    document.querySelectorAll('.form-field input, .form-field select, .form-field textarea').forEach(input => {
        input.addEventListener('invalid', e => {
            e.preventDefault();
            const field = input.closest('.form-field');
            if (field) {
                field.style.animation = 'shake 0.4s cubic-bezier(0.36,0.07,0.19,0.97)';
                setTimeout(() => { field.style.animation = ''; }, 450);
            }
        });
    });

    const shakeKf = document.createElement('style');
    shakeKf.textContent = `
        @keyframes shake {
            0%, 100% { transform: translateX(0); }
            20%       { transform: translateX(-8px); }
            40%       { transform: translateX(8px); }
            60%       { transform: translateX(-5px); }
            80%       { transform: translateX(5px); }
        }
    `;
    document.head.appendChild(shakeKf);

    /* ─── COLOR SWATCH ACTIVE STATE ─────────── */
    document.querySelectorAll('.color-swatches').forEach(group => {
        group.querySelectorAll('.swatch').forEach(sw => {
            sw.addEventListener('click', () => {
                group.querySelectorAll('.swatch').forEach(s => s.style.boxShadow = '');
                sw.style.boxShadow = `0 0 0 3px ${sw.style.background}, 0 0 0 5px rgba(34,197,94,0.6)`;
                sw.style.transform = 'scale(1.4)';
                setTimeout(() => { sw.style.transform = ''; }, 350);
            });
        });
    });

    /* ─── FOOTER SOCIAL HOVER ─────────────────── */
    document.querySelectorAll('.footer-social a').forEach(a => {
        a.addEventListener('mouseenter', () => {
            a.style.transform = 'translateY(-3px) scale(1.04)';
        });
        a.addEventListener('mouseleave', () => {
            a.style.transform = '';
        });
    });

    /* ─── TABLE ROW HOVER SOUND-FEEL ─────────── */
    document.querySelectorAll('.compare-table tbody tr').forEach(row => {
        row.addEventListener('mouseenter', () => {
            row.style.transition = 'background 0.25s ease, transform 0.25s ease';
        });
    });

    /* ─── BACK TO TOP ENHANCED ────────────────── */
    const btt = document.getElementById('backToTop');
    if (btt) {
        btt.addEventListener('click', () => {
            btt.style.transform = 'scale(0.9) translateY(4px)';
            setTimeout(() => { btt.style.transform = ''; }, 200);
        });
    }

    /* ─── INTERSECTION FOR TABLE ─────────────── */
    const compareTable = document.querySelector('.compare-table-wrap');
    if (compareTable && 'IntersectionObserver' in window) {
        const tableIO = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    compareTable.classList.add('visible');
                    tableIO.unobserve(compareTable);
                }
            });
        }, { threshold: 0.15 });
        tableIO.observe(compareTable);
    }

    /* ─── SECTION BACKGROUND MOUSE TILT ──────── */
    document.querySelectorAll('.why-ampere, .savings-section').forEach(section => {
        section.addEventListener('mousemove', e => {
            const rect = section.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width  - 0.5;
            const y = (e.clientY - rect.top)  / rect.height - 0.5;
            section.style.backgroundPosition = `${50 + x * 5}% ${50 + y * 5}%`;
        });
        section.addEventListener('mouseleave', () => {
            section.style.backgroundPosition = '';
        });
    });

    /* ═════════════════════════════════════════════
       NEW PREMIUM ANIMATIONS — v4
       Data attributes for advanced visual effects
       ═════════════════════════════════════════════ */

    /* ─── DYNAMIC DATA ATTRIBUTE ANIMATIONS ────── */
    // Handle data-float="true" elements
    document.querySelectorAll('[data-float="true"]').forEach(el => {
        el.style.animation = 'float 3.2s ease-in-out infinite';
    });

    // Handle data-bounce="true" elements
    document.querySelectorAll('[data-bounce="true"]').forEach(el => {
        el.addEventListener('mousedown', () => {
            el.style.animation = 'spring 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 1';
            setTimeout(() => { el.style.animation = ''; }, 600);
        });
    });

    // Handle data-shine="true" elements
    document.querySelectorAll('[data-shine="true"]').forEach(el => {
        // Shine effect already applied via CSS ::after, but we can enhance it
        el.addEventListener('mouseenter', () => {
            el.style.opacity = '0.98';
        });
        el.addEventListener('mouseleave', () => {
            el.style.opacity = '1';
        });
    });

    // Handle data-glow-text="true" elements
    document.querySelectorAll('[data-glow-text="true"]').forEach(el => {
        el.classList.add('text-glow');
    });

    // Handle data-gradient-text="true" elements
    document.querySelectorAll('[data-gradient-text="true"]').forEach(el => {
        el.classList.add('gradient-text');
    });

    /* ─── STAGGER GRID ANIMATIONS ──────────────– */
    document.querySelectorAll('.stagger-item').forEach((el, index) => {
        if (!el.style.transitionDelay) {
            const delay = Math.min(index * 0.08, 0.4);
            el.style.transitionDelay = `${delay}s`;
            el.classList.add('reveal-up');
        }
    });

    /* ─── ENHANCE GRADIENT TEXT ANIMATIONS ────– */
    const style = document.createElement('style');
    style.textContent = `
        .gradient-text {
            background: linear-gradient(
                90deg,
                #22c55e 0%,
                #4ade80 25%,
                #22c55e 50%,
                #4ade80 75%,
                #22c55e 100%
            );
            background-size: 200% auto;
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: gradientText 4s ease infinite;
        }

        .text-glow {
            animation: textGlowSubtle 3.5s ease-in-out infinite;
        }

        .gradient-text, [data-gradient-text="true"] {
            animation: gradientText 4s ease infinite !important;
        }

        [data-float="true"] {
            animation: float 3.2s ease-in-out infinite !important;
        }
    `;
    document.head.appendChild(style);

    /* ─── PARALLAX SCROLL ENHANCEMENT ───────── */
    if (!prefersReducedMotion) {
        let parallaxRaf;
        window.addEventListener('scroll', () => {
            if (parallaxRaf) return;
            parallaxRaf = requestAnimationFrame(() => {
                document.querySelectorAll('[data-parallax]').forEach(el => {
                    const rate = el.dataset.parallax || 0.5;
                    const yPos = -window.scrollY * rate;
                    el.style.transform = `translateY(${yPos}px)`;
                });
                parallaxRaf = null;
            });
        }, { passive: true });
    }

    /* ─── COUNTER ANIMATION FOR NUMBERS ──────– */
    document.querySelectorAll('[data-count]').forEach(el => {
        if (el.classList.contains('impact-num')) return; // Skip already handled
        
        if ('IntersectionObserver' in window) {
            const observer = new IntersectionObserver(entries => {
                entries.forEach(entry => {
                    if (entry.isIntersecting && !el.classList.contains('counted')) {
                        const target = parseInt(el.dataset.count, 10);
                        const suffix = el.dataset.suffix || '';
                        const dur = 2000;
                        const start = performance.now();

                        (function tick(now) {
                            const t = Math.min((now - start) / dur, 1);
                            const v = Math.floor(easeOutCubic(t) * target);
                            el.textContent = v.toLocaleString('en-IN') + suffix;
                            if (t < 1) requestAnimationFrame(tick);
                            else {
                                el.textContent = target.toLocaleString('en-IN') + suffix;
                                el.classList.add('counted');
                                observer.unobserve(el);
                            }
                        })(start);
                    }
                });
            }, { threshold: 0.5 });
            observer.observe(el);
        }
    });

    /* ─── SMOOTH SCROLL TO ANCHOR LINKS ─────── */
    document.querySelectorAll('a[href^="#"]').forEach(link => {
        link.addEventListener('click', e => {
            const target = document.querySelector(link.getAttribute('href'));
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ─── BUTTON TEXT CHANGE ON HOVER ─────────– */
    document.querySelectorAll('[data-hover-text]').forEach(btn => {
        const originalText = btn.textContent;
        const hoverText = btn.dataset.hoverText;
        btn.addEventListener('mouseenter', () => {
            btn.textContent = hoverText;
        });
        btn.addEventListener('mouseleave', () => {
            btn.textContent = originalText;
        });
    });

    /* ─── ELEMENT VISIBILITY ANIMATION ──────── */
    document.querySelectorAll('[data-visibility-toggle]').forEach(el => {
        el.addEventListener('click', () => {
            el.style.animation = 'none';
            setTimeout(() => {
                el.style.animation = '';
            }, 10);
        });
    });

    /* ─── ENHANCED FORM FIELD FOCUS ANIMATION – */
    document.querySelectorAll('input, select, textarea').forEach(field => {
        field.addEventListener('focus', () => {
            const parent = field.closest('.form-field') || field.closest('label')?.parentElement;
            if (parent) {
                parent.style.animation = 'focusPulse 0.4s ease';
                setTimeout(() => { parent.style.animation = ''; }, 400);
            }
        });
    });

    const focusStyle = document.createElement('style');
    focusStyle.textContent = `
        @keyframes focusPulse {
            0%   { transform: scale(1); }
            50%  { transform: scale(1.01); }
            100% { transform: scale(1); }
        }
    `;
    document.head.appendChild(focusStyle);

    /* ─── LAZY LOAD ANIMATION ──────────────── */
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.style.animation = 'fadeIn 0.6s ease';
                    observer.unobserve(img);
                }
            });
        }, { threshold: 0.1 });

        document.querySelectorAll('img[loading="lazy"]').forEach(img => {
            imageObserver.observe(img);
        });
    }

    /* ─── LINK UNDERLINE HOVER ANIMATION ────– */
    document.querySelectorAll('a:not([class])').forEach(link => {
        link.addEventListener('mouseenter', () => {
            link.style.borderBottom = '2px solid currentColor';
            link.style.paddingBottom = '2px';
            link.style.transition = 'all 0.3s ease';
        });
        link.addEventListener('mouseleave', () => {
            link.style.borderBottom = 'none';
            link.style.paddingBottom = '0';
        });
    });

    /* ─── SCROLL-TRIGGERED CLASS ADDITION ───– */
    if ('IntersectionObserver' in window) {
        const triggerElements = document.querySelectorAll('[data-trigger-class]');
        const triggerObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const className = entry.target.dataset.triggerClass;
                    entry.target.classList.add(className);
                    triggerObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.15 });

        triggerElements.forEach(el => triggerObserver.observe(el));
    }

    console.log('🚀 Animations v4 loaded — Premium UI active with advanced effects');

})();

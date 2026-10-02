/* =============================================
   AMPERE — SCRIPT v2  |  Bug-free & Polished
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {

    // ══════════════════════════════════════════
    // 1. NAVBAR — Scroll shadow + Back to Top
    // ══════════════════════════════════════════
    const navbar = document.getElementById('navbar');
    const backToTop = document.getElementById('backToTop');

    let rafScrollId = null;
    function onScrollRAF() {
        const scrollY = window.scrollY;
        if (navbar) navbar.classList.toggle('scrolled', scrollY > 40);
        if (backToTop) backToTop.classList.toggle('visible', scrollY > 450);
        rafScrollId = null;
    }

    window.addEventListener('scroll', () => {
        if (!rafScrollId) rafScrollId = requestAnimationFrame(onScrollRAF);
    }, { passive: true });
    onScrollRAF(); // run once on load

    if (backToTop) {
        backToTop.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    // ══════════════════════════════════════════
    // 2. HAMBURGER — Mobile menu with overlay
    // ══════════════════════════════════════════
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobileMenu');

    if (hamburger && mobileMenu) {
        const openMenu = () => {
            mobileMenu.classList.add('open');
            hamburger.classList.add('open');
            document.body.style.overflow = 'hidden';
        };
        const closeMenu = () => {
            mobileMenu.classList.remove('open');
            hamburger.classList.remove('open');
            document.body.style.overflow = '';
        };

        hamburger.addEventListener('click', (e) => {
            e.stopPropagation();
            mobileMenu.classList.contains('open') ? closeMenu() : openMenu();
        });

        // Close on overlay click (outside inner panel)
        mobileMenu.addEventListener('click', (e) => {
            const inner = mobileMenu.querySelector('.mobile-menu-inner');
            if (inner) {
                if (!inner.contains(e.target)) closeMenu();
                return;
            }
            if (e.target === mobileMenu) closeMenu();
        });

        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => {
                closeMenu();
            });
        });

        // Close on ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeMenu();
        });
    }

    // ══════════════════════════════════════════
    // 3. HERO INTERACTIVE MODEL HUD SWITCHER
    // ══════════════════════════════════════════
    const HERO_MODELS_DATA = {
        'nexus-st': {
            name: 'Ampere Nexus ST',
            tag: 'Connected Flagship',
            tagline: 'Smart connected flagship with 7-inch touchscreen TFT, Wi-Fi integration, and premium LFP battery safety.',
            price: '₹1,09,900*',
            emi: 'EMI from ₹2,699/mo*',
            specs: [
                { val: '136 km', lbl: 'IDC Range' },
                { val: '93 km/h', lbl: 'Top Speed' },
                { val: '3.3 hrs', lbl: 'Fast Charge' },
                { val: '7" TFT', lbl: 'Smart Touch' }
            ],
            img: 'ampere-images/Carbon-Knight-Main-Desktop.webp',
            alt: 'Ampere Nexus ST Electric Scooter',
            link: 'nexus-st.html'
        },
        'magnus-ex': {
            name: 'Ampere Magnus EX',
            tag: 'Smart Commuter',
            tagline: "India's favorite removable battery scooter. Detach and charge anywhere like your smartphone in 4-5 hours.",
            price: '₹89,999*',
            emi: 'EMI from ₹2,199/mo*',
            specs: [
                { val: '90 km', lbl: 'True Range' },
                { val: '53 km/h', lbl: 'Top Speed' },
                { val: '4-5 hrs', lbl: 'Charge Time' },
                { val: 'Removable', lbl: 'Battery Type' }
            ],
            img: 'images/magnus ex/download.jpg',
            alt: 'Ampere Magnus EX Electric Scooter',
            link: 'magnus-ex.html'
        },
        'magnus-grand': {
            name: 'Ampere Magnus Grand',
            tag: 'Family Favorite',
            tagline: 'Extra-spacious family electric scooter with 20% stronger chassis, extra legroom, and 5-year battery warranty.',
            price: '₹89,999*',
            emi: 'EMI from ₹2,199/mo*',
            specs: [
                { val: '80 km', lbl: 'True Range' },
                { val: '50 km/h', lbl: 'Top Speed' },
                { val: 'LFP Safe', lbl: 'Battery Tech' },
                { val: '5 Years', lbl: 'Warranty' }
            ],
            img: 'images/Magnus grand/Grand-desktop2.png',
            alt: 'Ampere Magnus Grand Electric Scooter',
            link: 'magnus-grand.html'
        },
        'magnus-gmax': {
            name: 'Ampere Magnus GMAX',
            tag: 'Max Range Champion',
            tagline: '100+ km true range long-distance commuter with 33 Litres extra-large boot storage and 3 kWh LFP battery.',
            price: '₹94,999*',
            emi: 'EMI from ₹2,349/mo*',
            specs: [
                { val: '142 km', lbl: 'IDC Range' },
                { val: '65 km/h', lbl: 'Top Speed' },
                { val: '3 kWh', lbl: 'LFP Battery' },
                { val: '33 L', lbl: 'Boot Space' }
            ],
            img: 'images/magnus grand max/blue-max-new.png',
            alt: 'Ampere Magnus GMAX Electric Scooter',
            link: 'magnus-gmax.html'
        },
        'magnus-neo': {
            name: 'Ampere Magnus Neo',
            tag: 'Best Value EV',
            tagline: 'Fresh modern styling with 20% stronger chassis, 12-inch alloy wheels, and long-life LFP battery pack.',
            price: '₹86,999*',
            emi: 'EMI from ₹2,099/mo*',
            specs: [
                { val: '85 km', lbl: 'True Range' },
                { val: '65 km/h', lbl: 'Top Speed' },
                { val: '12-inch', lbl: 'Alloy Wheels' },
                { val: '75,000 km', lbl: 'Warranty' }
            ],
            img: 'images/magnus neo/magnusneo-ocean-blue.png',
            alt: 'Ampere Magnus Neo Electric Scooter',
            link: 'magnus-neo.html'
        },
        'reo-80': {
            name: 'Ampere Reo 80',
            tag: 'No License Required',
            tagline: 'Compact, ultra-lightweight city scooter. No RTO driving license or registration needed for students & daily errands.',
            price: '₹59,999*',
            emi: 'EMI from ₹1,499/mo*',
            specs: [
                { val: '80 km', lbl: 'True Range' },
                { val: '25 km/h', lbl: 'Top Speed' },
                { val: 'No RTO', lbl: 'License Class' },
                { val: 'Lightweight', lbl: 'Easy Ride' }
            ],
            img: 'images/reo 80/reo-80-blue.png',
            alt: 'Ampere Reo 80 Electric Scooter',
            link: 'reo-80.html'
        },
        'reo-li': {
            name: 'Ampere Reo Li',
            tag: 'City Eco Runner',
            tagline: 'Affordable, easy-to-ride electric scooter with removable lithium battery for everyday neighborhood trips.',
            price: '₹54,999*',
            emi: 'EMI from ₹1,399/mo*',
            specs: [
                { val: '65 km', lbl: 'True Range' },
                { val: '25 km/h', lbl: 'Top Speed' },
                { val: 'Removable', lbl: 'Lithium Pack' },
                { val: 'Low Running', lbl: 'Cost' }
            ],
            img: 'images/reo li/s_gallery-red01.png',
            alt: 'Ampere Reo Li Electric Scooter',
            link: 'reo-li.html'
        }
    };

    const heroTabs = document.querySelectorAll('[data-hero-tab]');
    const heroStageTag = document.getElementById('heroStageTag');
    const heroStageName = document.getElementById('heroStageName');
    const heroStageTagline = document.getElementById('heroStageTagline');
    const heroStagePrice = document.getElementById('heroStagePrice');
    const heroStageEmi = document.getElementById('heroStageEmi');
    const heroStageImg = document.getElementById('heroStageImg');
    const heroStageDetailLink = document.getElementById('heroStageDetailLink');
    const heroHudGrid = document.getElementById('heroHudGrid');

    function switchHeroModel(modelKey) {
        const data = HERO_MODELS_DATA[modelKey];
        if (!data) return;

        heroTabs.forEach(tab => {
            const isActive = tab.getAttribute('data-hero-tab') === modelKey;
            tab.classList.toggle('active', isActive);
            tab.setAttribute('aria-selected', isActive ? 'true' : 'false');
        });

        if (heroStageImg) {
            heroStageImg.style.opacity = '0.4';
            heroStageImg.style.transform = 'scale(0.95)';
        }

        setTimeout(() => {
            if (heroStageTag) heroStageTag.textContent = data.tag;
            if (heroStageName) heroStageName.textContent = data.name;
            if (heroStageTagline) heroStageTagline.textContent = data.tagline;
            if (heroStagePrice) heroStagePrice.textContent = data.price;
            if (heroStageEmi) heroStageEmi.textContent = data.emi;
            if (heroStageDetailLink) heroStageDetailLink.href = data.link;

            if (heroHudGrid && data.specs) {
                heroHudGrid.textContent = '';
                data.specs.forEach(s => {
                    const card = document.createElement('div');
                    card.className = 'hero-hud-card';
                    const val = document.createElement('div');
                    val.className = 'hero-hud-val';
                    val.textContent = s.val || '';
                    const lbl = document.createElement('div');
                    lbl.className = 'hero-hud-lbl';
                    lbl.textContent = s.lbl || '';
                    card.appendChild(val);
                    card.appendChild(lbl);
                    heroHudGrid.appendChild(card);
                });
            }

            if (heroStageImg) {
                heroStageImg.src = data.img;
                heroStageImg.alt = data.alt;
                heroStageImg.style.opacity = '1';
                heroStageImg.style.transform = 'scale(1)';
            }
        }, 150);
    }

    heroTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const modelKey = tab.getAttribute('data-hero-tab');
            switchHeroModel(modelKey);
        });
    });

    // ══════════════════════════════════════════
    // 3B. LEGACY MODEL TABS & PANELS FALLBACK
    // ══════════════════════════════════════════
    const tabs = document.querySelectorAll('.model-tab');
    const panels = document.querySelectorAll('.model-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const targetId = 'panel-' + tab.dataset.model;
            const panel = document.getElementById(targetId);
            if (panel) panel.classList.add('active');
        });
    });

    // ══════════════════════════════════════════
    // 3B. COLOUR SHOWCASE — Interactive shade switcher
    // ══════════════════════════════════════════
    document.querySelectorAll('[data-colour-showcase]').forEach(showcase => {
        const image = showcase.querySelector('[data-colour-image]');
        const title = showcase.querySelector('[data-colour-title]');
        const copy = showcase.querySelector('[data-colour-copy]');
        const options = Array.from(showcase.querySelectorAll('[data-colour-option]'));

        if (!image || !title || !copy || options.length === 0) return;

        const activateColour = (option) => {
            if (!option) return;
            options.forEach(btn => {
                const isActive = btn === option;
                btn.classList.toggle('is-active', isActive);
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            image.style.opacity = '0.55';
            requestAnimationFrame(() => {
                image.src = option.dataset.img || image.src;
                image.alt = option.dataset.alt || image.alt;
                title.textContent = option.dataset.title || title.textContent;
                copy.textContent = option.dataset.copy || copy.textContent;
                image.style.opacity = '1';
            });
        };

        options.forEach(option => {
            option.addEventListener('click', () => activateColour(option));
        });

        activateColour(options.find(option => option.classList.contains('is-active')) || options[0]);
    });

    // ══════════════════════════════════════════
    // 3C. GMAX FEATURE TABS — Swap images/captions
    // ══════════════════════════════════════════
    document.querySelectorAll('[data-gmax-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            const tabs = Array.from(tab.parentElement.querySelectorAll('[data-gmax-tab]'));
            const section = tab.closest('.gmax-feature-journey');
            if (!section) return;

            const imageOne = section.querySelector('[data-gmax-image-one]');
            const imageTwo = section.querySelector('[data-gmax-image-two]');
            const captionOne = section.querySelector('[data-gmax-caption-one]');
            const captionTwo = section.querySelector('[data-gmax-caption-two]');
            if (!imageOne || !imageTwo || !captionOne || !captionTwo) return;

            tabs.forEach(btn => {
                const isActive = btn === tab;
                btn.classList.toggle('is-active', isActive);
                btn.setAttribute('aria-pressed', isActive ? 'true' : 'false');
            });

            [imageOne, imageTwo].forEach(img => {
                img.style.opacity = '0.55';
            });

            requestAnimationFrame(() => {
                imageOne.src = tab.dataset.imageOne || imageOne.src;
                imageOne.alt = tab.dataset.altOne || imageOne.alt;
                captionOne.textContent = tab.dataset.captionOne || captionOne.textContent;

                imageTwo.src = tab.dataset.imageTwo || imageTwo.src;
                imageTwo.alt = tab.dataset.altTwo || imageTwo.alt;
                captionTwo.textContent = tab.dataset.captionTwo || captionTwo.textContent;

                [imageOne, imageTwo].forEach(img => {
                    img.style.opacity = '1';
                });
            });
        });
    });

    // ══════════════════════════════════════════
    // 4. SCROLL REVEAL — IntersectionObserver
    // ══════════════════════════════════════════
    const revealElements = document.querySelectorAll('.reveal-up');
    if (revealElements.length > 0 && 'IntersectionObserver' in window) {
        const io = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    io.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        revealElements.forEach(el => io.observe(el));
    } else {
        // Fallback — show all if observer not supported
        revealElements.forEach(el => el.classList.add('visible'));
    }

    // ══════════════════════════════════════════
    // 5. ANIMATED COUNTERS — Impact strip
    // ══════════════════════════════════════════
    function animateCount(el, target, suffix = '') {
        const duration = 1800;
        const startTime = performance.now();
        const startVal = 0;

        const tick = (now) => {
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease out cubic
            const eased = 1 - Math.pow(1 - progress, 3);
            const current = Math.floor(startVal + (target - startVal) * eased);
            el.textContent = current.toLocaleString('en-IN') + suffix;
            if (progress < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
    }

    const impactNums = document.querySelectorAll('.impact-num[data-count]');
    if (impactNums.length > 0 && 'IntersectionObserver' in window) {
        const countIO = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const target = parseInt(el.dataset.count, 10);
                    const suffix = el.dataset.suffix || '';
                    animateCount(el, target, suffix);
                    countIO.unobserve(el);
                }
            });
        }, { threshold: 0.5 });
        impactNums.forEach(el => countIO.observe(el));
    }

    // ══════════════════════════════════════════
    // 6. SAVINGS CALCULATOR — Full logic
    // ══════════════════════════════════════════
    const kmSlider   = document.getElementById('kmSlider');
    const kmDisplay  = document.getElementById('kmDisplay');
    const monthlySaving = document.getElementById('monthlySaving');
    const yearlySaving  = document.getElementById('yearlySaving');
    const petrolBar  = document.getElementById('petrolBar');
    const evBar      = document.getElementById('evBar');
    const petrolAmt  = document.getElementById('petrolAmt');
    const evAmt      = document.getElementById('evAmt');

    const PETROL_PRICE = 100;       // ₹ per litre
    const PETROL_MILEAGE = 40;      // km per litre
    const UNIT_PRICE = 8;           // ₹ per kWh
    const EV_EFFICIENCY = 30;       // km per kWh
    const MAINTENANCE_DIFF = 500;   // ₹ monthly maintenance saving

    function fmt(n) { return Math.round(n).toLocaleString('en-IN'); }

    function animateValue(el, from, to, duration = 500) {
        if (!el) return;
        const startTime = performance.now();
        const update = (now) => {
            const t = Math.min((now - startTime) / duration, 1);
            const eased = 1 - Math.pow(1 - t, 3);
            el.textContent = fmt(from + (to - from) * eased);
            if (t < 1) el.rafId = requestAnimationFrame(update);
        };
        if (el.rafId) cancelAnimationFrame(el.rafId);
        el.rafId = requestAnimationFrame(update);
    }

    let prevMonthly = 3200, prevYearly = 38400;

    function calcSavings() {
        if (!kmSlider) return;
        const km = parseInt(kmSlider.value, 10);
        if (kmDisplay) kmDisplay.textContent = `${km} km/day`;

        const dailyPetrolCost = (km / PETROL_MILEAGE) * PETROL_PRICE;
        const dailyEvCost = (km / EV_EFFICIENCY) * UNIT_PRICE;
        const petrolMonthly = dailyPetrolCost * 30;
        const evMonthly = dailyEvCost * 30;
        const monthly = Math.round(petrolMonthly - evMonthly + MAINTENANCE_DIFF);
        const yearly = monthly * 12;

        animateValue(monthlySaving, prevMonthly, monthly);
        animateValue(yearlySaving, prevYearly, yearly);
        prevMonthly = monthly; prevYearly = yearly;

        if (petrolAmt) petrolAmt.textContent = '₹' + fmt(petrolMonthly);
        if (evAmt) evAmt.textContent = '₹' + fmt(evMonthly);

        if (petrolBar && evBar) {
            const ratio = Math.max(5, Math.round((evMonthly / Math.max(petrolMonthly, 1)) * 100));
            evBar.style.height = ratio + '%';
            petrolBar.style.height = '100%';
        }
    }

    if (kmSlider) {
        let calcRaf = null;
        kmSlider.addEventListener('input', () => {
            if (!calcRaf) calcRaf = requestAnimationFrame(() => { calcSavings(); calcRaf = null; });
        });
        calcSavings(); // initial render
    }

    // ══════════════════════════════════════════
    // 7. FAQ ACCORDION
    // ══════════════════════════════════════════
    window.toggleFaq = function(btn) {
        const item = btn.closest('.faq-item');
        if (!item) return;
        const isOpen = item.classList.contains('open');
        document.querySelectorAll('.faq-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
    };

    // ══════════════════════════════════════════
    // 8. FORM SUBMIT — Enhanced validation
    // ══════════════════════════════════════════
    window.handleFormSubmit = function(e) {
        e.preventDefault();
        const form = e.target;
        const btn = form.querySelector('button[type="submit"]');
        if (!btn) return;

        // Clear previous error messages
        form.querySelectorAll('.form-error').forEach(el => el.remove());

        // Enhanced form field retrieval
        const getValue = (id) => {
            const el = form.querySelector('#' + id) || form.querySelector('[name="' + id + '"]');
            return el ? el.value.trim() : '';
        };

        const name    = getValue('fname')    || getValue('name')    || getValue('fullname') || getValue('cname');
        const phone   = getValue('fphone')   || getValue('phone')   || getValue('mobile')   || getValue('tel');
        const model   = getValue('fmodel')   || getValue('model')   || getValue('scooter');
        const pincode = getValue('fpincode') || getValue('pincode') || getValue('zip');
        const city    = getValue('city')     || getValue('location');
        const message = getValue('fmessage') || getValue('message') || getValue('msg')      || getValue('query');
        const subject = getValue('subject')  || getValue('type');

        // Enhanced validation with error messages
        const errors = [];
        
        // Name validation
        if (!name || name.length < 2) {
            errors.push('Please enter your full name (at least 2 characters)');
        } else if (!/^[a-zA-Z\s'-]+$/.test(name)) {
            errors.push('Name should only contain letters, spaces, hyphens, or apostrophes');
        }
        
        // Phone normalization and Indian 10-digit validation
        const rawPhone = phone.replace(/[\s\-\(\)\.]/g, '');
        let cleanPhone = rawPhone;
        if (cleanPhone.startsWith('+91')) cleanPhone = cleanPhone.slice(3);
        else if (cleanPhone.startsWith('91') && cleanPhone.length === 12) cleanPhone = cleanPhone.slice(2);
        else if (cleanPhone.startsWith('0') && cleanPhone.length === 11) cleanPhone = cleanPhone.slice(1);

        if (!cleanPhone || !/^[6-9]\d{9}$/.test(cleanPhone)) {
            errors.push('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9)');
        }
        
        // Pincode validation (optional but if provided must be valid)
        if (pincode && !/^[0-9]{6}$/.test(pincode)) {
            errors.push('Pincode must be exactly 6 digits');
        }
        
        // Message length validation
        if (message && message.length > 1000) {
            errors.push('Message is too long (maximum 1000 characters)');
        }

        // Show validation errors if any
        if (errors.length > 0) {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = 'background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px 16px; margin-bottom: 16px; color: #991b1b; font-size: 0.9rem; line-height: 1.5;';
            const strong = document.createElement('strong');
            strong.textContent = 'Please correct the following:';
            errorDiv.appendChild(strong);
            const ul = document.createElement('ul');
            ul.style.cssText = 'margin: 8px 0 0 20px; padding: 0;';
            errors.forEach(err => {
                const li = document.createElement('li');
                li.style.marginTop = '6px';
                li.textContent = err;
                ul.appendChild(li);
            });
            errorDiv.appendChild(ul);
            form.insertBefore(errorDiv, form.firstChild);
            window.scrollTo({ top: form.offsetTop - 100, behavior: 'smooth' });
            return;
        }

        const originalText = btn.textContent;
        btn.textContent = 'Sending...';
        btn.disabled = true;
        btn.style.opacity = '0.7';

        const source = window.location.pathname.split('/').pop().replace('.html','') || 'Home';
        const honeypot = getValue('_hp') || getValue('website') || getValue('botcheck');
        const payload = { name, phone: cleanPhone, model, pincode, city, message: message || subject, source, _hp: honeypot };

        function resetButton() {
            btn.textContent = originalText;
            btn.style.background = '';
            btn.style.opacity = '';
            btn.disabled = false;
        }

        function showSuccess() {
            btn.textContent = '✓ Enquiry Submitted Successfully!';
            btn.style.background = '#16a34a';
            btn.style.opacity = '1';
            form.reset();
            form.querySelectorAll('.form-error').forEach(el => el.remove());
            setTimeout(resetButton, 5000);
            
            // Analytics tracking (if available)
            if (window.gtag) {
                gtag('event', 'form_submission', { source: source });
            }
        }

        function showError(errorMsg) {
            btn.textContent = '❌ Submission Failed — Call / WhatsApp Us';
            btn.style.background = '#dc2626';
            btn.style.opacity = '1';
            const errorDiv = document.createElement('div');
            errorDiv.className = 'form-error';
            errorDiv.style.cssText = 'background: #fee2e2; border: 1px solid #fca5a5; border-radius: 8px; padding: 14px 16px; margin-bottom: 16px; color: #991b1b; font-size: 0.95rem; line-height: 1.5;';
            const strong = document.createElement('strong');
            strong.textContent = errorMsg || 'We could not submit your enquiry automatically.';
            errorDiv.appendChild(strong);
            errorDiv.appendChild(document.createElement('br'));
            const span = document.createElement('span');
            span.textContent = 'Please reach out directly: ';
            errorDiv.appendChild(span);
            const callLink = document.createElement('a');
            callLink.href = 'tel:+919890202091';
            callLink.style.cssText = 'color: #15803d; font-weight: bold; text-decoration: underline; margin-right: 12px;';
            callLink.textContent = '📞 Call +91-9890202091';
            errorDiv.appendChild(callLink);
            const waLink = document.createElement('a');
            waLink.href = 'https://wa.me/919890202091?text=Hi%2C%20I%20would%20like%20to%20enquire%20about%20Ampere%20scooters';
            waLink.target = '_blank';
            waLink.style.cssText = 'color: #15803d; font-weight: bold; text-decoration: underline;';
            waLink.textContent = '💬 WhatsApp Us';
            errorDiv.appendChild(waLink);
            form.insertBefore(errorDiv, form.firstChild);
            setTimeout(resetButton, 8000);
        }

        window.api('/api/submit-lead', { method: 'POST', body: payload }).then(async function(response) {
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Server error ' + response.status);
            }
            showSuccess();
        }).catch(function(err) {
            console.error('Lead submission failed:', err);
            showError(err.message || 'Submission failed.');
        });
    };

    // ══════════════════════════════════════════
    // 9. SMOOTH SCROLL
    // ══════════════════════════════════════════
    document.querySelectorAll('a[href^="#"]').forEach(a => {
        a.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (!href || href === '#') return;
            const target = document.querySelector(href);
            if (!target) return;
            e.preventDefault();
            const offset = 80;
            const top = target.getBoundingClientRect().top + window.scrollY - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        });
    });

    // ══════════════════════════════════════════
    // 10. SPEC TAB SWITCHER (model pages)
    // ══════════════════════════════════════════
    window.switchSpecTab = function(btn, id) {
        const section = btn.closest('section') || document;
        section.querySelectorAll('.stab').forEach(b => b.classList.remove('active'));
        section.querySelectorAll('.spec-tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        const panel = document.getElementById('spec-' + id);
        if (panel) panel.classList.add('active');
    };

    // ══════════════════════════════════════════
    // 11. ACTIVE NAV LINK highlight
    // ══════════════════════════════════════════
    const currentPath = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes(currentPath)) {
            link.classList.add('active');
        }
    });

    // ══════════════════════════════════════════
    // 13. LINEUP CATEGORY FILTER CHIPS
    // ══════════════════════════════════════════
    const filterBtns = document.querySelectorAll('.filter-chip-btn');
    const lineupCards = document.querySelectorAll('.ev-lineup-card');

    if (filterBtns.length > 0 && lineupCards.length > 0) {
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const targetFilter = btn.getAttribute('data-filter');
                filterBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                lineupCards.forEach(card => {
                    const cardCat = card.getAttribute('data-category');
                    if (targetFilter === 'all' || cardCat === targetFilter) {
                        card.style.display = 'flex';
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    } else {
                        card.style.display = 'none';
                    }
                });
            });
        });
    }

    // ══════════════════════════════════════════
    // 14. FAQ ACCORDION INTERACTIVE HANDLER
    // ══════════════════════════════════════════
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const btn = item.querySelector('.faq-question-btn');
        const panel = item.querySelector('.faq-answer-panel');
        if (btn && panel) {
            btn.addEventListener('click', () => {
                const isOpen = item.classList.contains('active');
                
                // Close other items
                faqItems.forEach(other => {
                    other.classList.remove('active');
                    const otherPanel = other.querySelector('.faq-answer-panel');
                    if (otherPanel) otherPanel.style.display = 'none';
                });

                if (!isOpen) {
                    item.classList.add('active');
                    panel.style.display = 'block';
                }
            });
        }
    });

});


function showOfflineApiFallback() {
  const box = document.createElement('div');
  box.className = 'offline-api-banner';
  box.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;background:#0f172a;color:#f8fafc;border:1px solid #38bdf8;padding:16px 20px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.5);max-width:380px;font-size:14px;line-height:1.5;';

  const strong = document.createElement('strong');
  strong.textContent = '⚡ Notice: ';
  box.appendChild(strong);
  box.appendChild(document.createTextNode('Online service temporarily unavailable. Please call us at '));

  const phoneLink = document.createElement('a');
  phoneLink.href = 'tel:+919890202091';
  phoneLink.style.cssText = 'color:#38bdf8;font-weight:700;';
  phoneLink.textContent = '+91 98902 02091';
  box.appendChild(phoneLink);

  box.appendChild(document.createTextNode(' or '));

  const waLink = document.createElement('a');
  waLink.href = 'https://wa.me/919890202091';
  waLink.target = '_blank';
  waLink.rel = 'noopener noreferrer';
  waLink.style.cssText = 'color:#22c55e;font-weight:700;';
  waLink.textContent = 'WhatsApp Us';
  box.appendChild(waLink);

  box.appendChild(document.createTextNode(' for instant assistance!'));

  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.cssText = 'float:right;background:none;border:none;color:#94a3b8;font-size:16px;cursor:pointer;margin-left:12px;';
  closeBtn.onclick = () => box.remove();
  box.appendChild(closeBtn);

  document.body.appendChild(box);
  setTimeout(() => box.remove(), 10000);
}
window.showOfflineApiFallback = showOfflineApiFallback;

/* ============================================================
   CHATBOT ENGINE — Jai Mata Di Auto
   Rule-based AI chatbot with lead capture
   ============================================================ */
(function () {
    'use strict';

    // ── Models data ─────────────────────────────────────────
    const MODELS = [
        { name: 'Nexus ST',     price: 134900, range: 136, speed: 93,  charge: 3.3, type: 'premium',    budget: 'high' },
        { name: 'Magnus GMAX',  price: 112900, range: 142, speed: 65,  charge: 7.5, type: 'long-range', budget: 'mid' },
        { name: 'Magnus EX',    price: 89900,  range: 90,  speed: 53,  charge: 6,   type: 'comfort',    budget: 'mid' },
        { name: 'Magnus Grand', price: 79900,  range: 80,  speed: 50,  charge: 6,   type: 'value',      budget: 'mid' },
        { name: 'Magnus Neo',   price: 84900,  range: 85,  speed: 65,  charge: 6.5, type: 'smart',      budget: 'mid' },
        { name: 'Reo 80',       price: 59900,  range: 80,  speed: 25,  charge: 5.5, type: 'city',       budget: 'low' },
        { name: 'Reo Li',       price: 54900,  range: 60,  speed: 25,  charge: 4,   type: 'budget',     budget: 'low' },
    ];

    // ── Conversation state ───────────────────────────────────
    const state = { step: 'init', leadName: '', leadPhone: '', budget: '' };

    // ── Knowledge base for keyword matching ─────────────────
    const FAQ = [
        { keys: ['price','cost','rate','kitna','kitne','how much','amount'],
          reply: 'Our scooters start from <b>₹54,900</b> (Reo Li) up to <b>₹1,34,900</b> (Nexus ST). All prices are ex-showroom Loni.\n\nWhich model are you interested in?' },
        { keys: ['range','kitna chalta','km','kilometer','mileage'],
          reply: 'Range varies by model:\n• Nexus ST — 136 km\n• Magnus GMAX — 142 km\n• Magnus EX — 90 km\n• Magnus Grand — 80 km\n• Magnus Neo — 85 km\n• Reo 80 — 80 km\n• Reo Li — 60 km\n\nAll ranges are manufacturer-claimed.' },
        { keys: ['charge','charging','time','bijli','current'],
          reply: 'Charging time ranges from <b>3.3 hrs (Nexus ST)</b> to <b>7.5 hrs (Magnus GMAX)</b>. All models use a standard 15A home socket. No special charging station needed!' },
        { keys: ['emi','loan','finance','kist','monthly','installment'],
          reply: 'Yes! We offer easy EMI options:\n• Down payment from 10%\n• Tenure: 12 / 24 / 36 months\n• Starting from ~₹1,800/month\n\nCheck our <a href="savings.html" style="color:#22c55e">EMI Calculator →</a>' },
        { keys: ['test ride','test drive','trial','try'],
          reply: 'Book a FREE test ride at our Loni showroom! 🛵\n\n<a href="test-ride.html" style="color:#22c55e">Click here to book your slot →</a>' },
        { keys: ['location','address','where','kahan','showroom','loni'],
          reply: '📍 <b>Jai Mata Di Auto</b>\nLoni Babhaleshwar Road, Opp. Shivkanta Lawns,\nNear Dhanalaxmi Traders, Loni, MH – 413713\n\n🕐 Mon–Sat: 9:30 AM – 7:00 PM\n📞 <a href="tel:+919890202091" style="color:#22c55e">+91-9890202091</a>' },
        { keys: ['warranty','guarantee','service','repair'],
          reply: 'Ampere scooters come with:\n• 3-year vehicle warranty\n• 5-year / 75,000 km on LFP batteries (Nexus ST & GMAX)\n• Pan-India service network with 500+ centres' },
        { keys: ['licence','license','permit','registration','rto'],
          reply: 'The <b>Reo 80</b> and <b>Reo Li</b> do <b>NOT</b> require a driving licence or registration — they run at ≤25 km/h.\n\nAll other models require a standard driving licence.' },
        { keys: ['colour','color','rang'],
          reply: 'Ampere scooters are available in multiple colours! Availability depends on stock. Visit our showroom or call <a href="tel:+919890202091" style="color:#22c55e">+91-9890202091</a> to check current stock.' },
        { keys: ['hello','hi','helo','hey','namaste','namaskar','hii'],
          reply: null, special: 'greet' },
        { keys: ['bye','goodbye','thanks','thank you','ok done','thx'],
          reply: 'Thank you for chatting with us! 😊\nFeel free to call us at <a href="tel:+919890202091" style="color:#22c55e">+91-9890202091</a> anytime.\n\nVisit us at Loni showroom — Mon to Sat, 9:30 AM – 7 PM. <b>Jai Mata Di! 🙏</b>' },
    ];

    // ── Chatbot flows ────────────────────────────────────────
    const FLOWS = {
        init: {
            msg: 'Namaste! 🙏 I\'m <b>Ampere Assist</b>, your virtual assistant at <b>Jai Mata Di Auto</b>.\n\nHow can I help you today?',
            options: ['🛵 Find best scooter', '💰 Price & EMI', '📍 Showroom location', '🔖 Book test ride', '💬 Other question']
        }
    };

    // ── Recommend model based on budget ─────────────────────
    function recommendModels(budget) {
        const map = { low: ['Reo Li', 'Reo 80'], mid: ['Magnus Grand', 'Magnus Neo', 'Magnus EX', 'Magnus GMAX'], high: ['Nexus ST', 'Magnus GMAX'] };
        const names = map[budget] || map['mid'];
        return MODELS.filter(m => names.includes(m.name));
    }

    // ── Build HTML elements ──────────────────────────────────
    function buildWidget() {
        document.body.insertAdjacentHTML('beforeend', `
        <button class="chat-bubble" id="chatBubble" aria-label="Chat with us">
            <svg viewBox="0 0 24 24"><path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/></svg>
            <span class="chat-badge">1</span>
        </button>
        <div class="chat-window" id="chatWindow">
            <div class="chat-header">
                <div class="chat-avatar">⚡</div>
                <div class="chat-header-info">
                    <h4>Ampere Assist</h4>
                    <p>● Online — replies instantly</p>
                </div>
                <button class="chat-close" id="chatClose">✕</button>
            </div>
            <div class="chat-messages" id="chatMessages"></div>
            <div class="chat-input-wrap">
                <input class="chat-input" id="chatInput" placeholder="Type a message..." autocomplete="off">
                <button class="chat-send" id="chatSend">
                    <svg viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/></svg>
                </button>
            </div>
        </div>`);
    }

    // ── DOM helpers ──────────────────────────────────────────
    function getEl(id) { return document.getElementById(id); }

    function appendMsg(text, who) {
        const msgs = getEl('chatMessages');
        const div = document.createElement('div');
        div.className = 'chat-msg ' + who;
        if (who === 'bot') {
            const botName = document.createElement('span');
            botName.className = 'bot-name';
            botName.textContent = 'Ampere Assist';
            div.append(botName, document.createTextNode(text));
        } else {
            div.textContent = text;
        }
        msgs.appendChild(div);
        msgs.scrollTop = msgs.scrollHeight;
        return div;
    }

    function appendOptions(opts) {
        const msgs = getEl('chatMessages');
        const wrap = document.createElement('div');
        wrap.className = 'chat-options';
        opts.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-opt-btn';
            btn.textContent = opt;
            btn.onclick = () => { wrap.remove(); handleUserInput(opt); };
            wrap.appendChild(btn);
        });
        msgs.appendChild(wrap);
        msgs.scrollTop = msgs.scrollHeight;
    }

    function showTyping(delay) {
        return new Promise(resolve => {
            const msgs = getEl('chatMessages');
            const el = document.createElement('div');
            el.className = 'chat-typing';
            const s1 = document.createElement('span');
            const s2 = document.createElement('span');
            const s3 = document.createElement('span');
            el.append(s1, s2, s3);
            msgs.appendChild(el);
            msgs.scrollTop = msgs.scrollHeight;
            setTimeout(() => { el.remove(); resolve(); }, delay || 900);
        });
    }

    async function botSay(text, opts, delay) {
        await showTyping(delay || 800);
        appendMsg(text, 'bot');
        if (opts && opts.length) appendOptions(opts);
    }

    // ── Lead capture ─────────────────────────────────────────
    async function captureContact(source) {
        await botSay('Before I proceed, may I get your name so I can assist you better? 😊');
        state.step = 'awaitName';
        state.leadSource = source || 'chatbot';
    }

    async function saveChatLead() {
        const data = {
            name: state.leadName,
            phone: state.leadPhone,
            source: state.leadSource || 'Chatbot',
            model: state.recommendedModel || '',
            message: 'Chatbot enquiry'
        };
        // Save to backend CRM
        try {
            const res = await window.api('/api/submit-lead', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            const json = await res.json().catch(() => ({}));
            if (!res.ok || !json.success) throw new Error(json.error || 'Server error');
            return true;
        } catch (e) {
            console.error('Chatbot lead submission error:', e);
            return false;
        }
    }

    // ── Main input handler ───────────────────────────────────
    async function handleUserInput(text) {
        if (!text.trim()) return;
        getEl('chatInput').value = '';
        appendMsg(text, 'user');

        const lower = text.toLowerCase();

        // ── State machine ─────────────────────────────────
        if (state.step === 'awaitName') {
            state.leadName = text.trim();
            state.step = 'awaitPhone';
            await botSay(`Nice to meet you, <b>${state.leadName}</b>! 😊 Could I get your phone number so our team can follow up?`);
            return;
        }

        if (state.step === 'awaitPhone') {
            const rawDigits = text.replace(/[\s\-\(\)\.]/g, '').replace(/^(\+91|91|0)/, '');
            if (!/^[6-9]\d{9}$/.test(rawDigits)) {
                await botSay('Please enter a valid 10-digit Indian mobile number (starting with 6, 7, 8, or 9).');
                return;
            }
            state.leadPhone = rawDigits;
            state.step = 'done';
            const ok = await saveChatLead();
            if (ok) {
                await botSay(`Thank you, <b>${state.leadName}</b>! 🎉\nOur team will call you at <b>${state.leadPhone}</b> shortly.\n\nIs there anything else I can help you with?`,
                    ['🛵 Model info', '📍 Location', '🔖 Book test ride', 'No, thanks!']);
            } else {
                await botSay(`Thank you, <b>${state.leadName}</b>! We had trouble recording your request automatically.\n\nPlease call us or WhatsApp directly at <a href="https://wa.me/919890202091?text=Hi%2C%20my%20name%20is%20${encodeURIComponent(state.leadName)}" target="_blank" style="color:#22c55e;font-weight:bold;">+91-9890202091</a> so we can assist you immediately! 🙏`,
                    ['📍 Location', '🛵 Model info', 'No, thanks!']);
            }
            return;
        }

        if (state.step === 'awaitBudget') {
            let budget = 'mid';
            if (lower.includes('50') || lower.includes('60') || lower.includes('below 70') || lower.includes('under 70') || lower.includes('low') || lower.includes('reo')) budget = 'low';
            else if (lower.includes('1 lakh') || lower.includes('premium') || lower.includes('nexus') || lower.includes('best') || lower.includes('top')) budget = 'high';
            state.budget = budget;
            state.step = 'showRec';
            const recs = recommendModels(budget);
            state.recommendedModel = recs[0].name;
            const recText = recs.map(m => `• <b>${m.name}</b> — ₹${m.price.toLocaleString('en-IN')} | ${m.range}km range | ${m.speed}km/h`).join('\n');
            await botSay(`Based on your budget, here are my top picks:\n\n${recText}\n\nWould you like to book a test ride or know more?`,
                ['🔖 Book test ride', '💰 EMI options', '📞 Call me back', '⬅️ See all models']);
            return;
        }

        // ── Quick options ─────────────────────────────────
        if (text.includes('Find best scooter') || text.includes('recommend') || lower === 'model info') {
            state.step = 'awaitBudget';
            await botSay('I\'ll help you find the perfect Ampere scooter! 🛵\n\nWhat\'s your approximate <b>budget</b>?',
                ['Under ₹70,000', '₹70,000 – ₹1 Lakh', 'Above ₹1 Lakh', 'Best in range', 'Best speed']);
            return;
        }

        if (text.includes('Price & EMI') || lower.includes('emi') || lower.includes('price')) {
            await botSay(FAQ.find(f => f.keys.includes('emi')).reply,
                ['📋 All model prices', '🔖 Book test ride', '📞 Call me back']);
            return;
        }

        if (text.includes('Book test ride') || lower.includes('book') || lower.includes('test ride')) {
            await botSay('Book a FREE test ride at our Loni showroom! 🛵\n\nPick your preferred time online or I can have our team call you.\n\n<a href="test-ride.html" style="color:#22c55e;text-decoration:none;font-weight:600;">📅 Book Online →</a>',
                ['📞 Call me back', '📍 Get directions', '✅ Done, thanks!']);
            return;
        }

        if (text.includes('Showroom location') || lower.includes('location') || lower.includes('address') || lower.includes('kahan')) {
            await botSay(FAQ.find(f => f.keys.includes('location')).reply,
                ['🗺️ Get directions', '📞 Call us', '🔖 Book test ride']);
            return;
        }

        if (text.includes('Call me back') || lower.includes('call me') || lower.includes('contact me')) {
            if (!state.leadName) { captureContact('call-request'); return; }
            await botSay(`Our team will call you at <b>${state.leadPhone}</b> shortly! 📞\n\nIs there anything else?`,
                ['🛵 Model info', '📍 Location', 'No, thanks!']);
            return;
        }

        if (text.includes('All model prices')) {
            const prices = MODELS.map(m => `• <b>${m.name}</b> — ₹${m.price.toLocaleString('en-IN')}`).join('\n');
            await botSay(`All models (ex-showroom Loni):\n\n${prices}\n\nPrices may vary. Call us for latest offers!`,
                ['💳 EMI options', '🔖 Book test ride', '📞 Call me back']);
            return;
        }

        if (text.includes('Get directions') || lower.includes('direction') || lower.includes('map')) {
            await botSay('📍 <b>Get Directions</b>\n\n<a href="https://maps.google.com/?q=Jai+Mata+Di+Auto+Loni+Maharashtra" target="_blank" style="color:#22c55e">Open in Google Maps →</a>\n\nLoni Babhaleshwar Road, Loni, MH – 413713');
            return;
        }

        if (lower.includes('thanks') || lower.includes('thank you') || lower.includes('ok done') || lower.includes('no, thanks') || lower.includes('done')) {
            await botSay('You\'re welcome! 😊 Feel free to come back anytime.\n\n<b>Jai Mata Di! 🙏</b>');
            return;
        }

        // ── Keyword matching ───────────────────────────────
        for (const faq of FAQ) {
            if (faq.keys.some(k => lower.includes(k))) {
                if (faq.special === 'greet') {
                    await botSay(FLOWS.init.msg, FLOWS.init.options);
                } else {
                    await botSay(faq.reply, ['🔖 Book test ride', '📞 Call me back', '⬅️ Main menu']);
                }
                return;
            }
        }

        // ── Fallback ───────────────────────────────────────
        if (!state.leadName) {
            await botSay('Great question! Let me connect you with our team for the best answer.\n\nMay I get your name first?');
            state.step = 'awaitName';
        } else {
            await botSay('I\'ll pass this to our team! They will call you at <b>' + state.leadPhone + '</b> shortly.\n\nAnything else?',
                ['🛵 Find scooter', '💰 Prices', '📍 Location', 'No, thanks!']);
        }
    }

    // ── Init ─────────────────────────────────────────────────
    function init() {
        buildWidget();

        const bubble = getEl('chatBubble');
        const win    = getEl('chatWindow');
        const closeBtn = getEl('chatClose');
        const input  = getEl('chatInput');
        const send   = getEl('chatSend');

        let opened = false;

        bubble.addEventListener('click', async () => {
            win.classList.toggle('open');
            bubble.querySelector('.chat-badge').remove();
            if (!opened) {
                opened = true;
                await botSay(FLOWS.init.msg, FLOWS.init.options);
            }
        });

        closeBtn.addEventListener('click', () => win.classList.remove('open'));

        const sendMsg = () => {
            const v = input.value.trim();
            if (v) handleUserInput(v);
        };

        send.addEventListener('click', sendMsg);
        input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsg(); });

        // Auto-open after 45s if not yet opened
        setTimeout(() => {
            if (!opened) {
                win.classList.add('open');
                opened = true;
                botSay(FLOWS.init.msg, FLOWS.init.options);
            }
        }, 45000);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();

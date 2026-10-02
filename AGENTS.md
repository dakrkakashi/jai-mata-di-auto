# Jai Mata Di Auto — OpenCode Guide

## Quick start

```bash
npm install        # install dependencies
node server.js     # backend + static site on port 3000 (see warning)
start-admin.bat    # Windows: npm install, opens browser, starts server
```

**⚠️ `server.js` currently fails to boot** — `adminAuth` is declared twice (~line 147 as cookie-aware const arrow fn, ~line 811 as header-only function above the spare-parts routes) → `SyntaxError: Identifier 'adminAuth' has already been declared`. Fix = keep one definition. Note they differ semantically: the first also accepts the `jmd_admin` cookie; the second only the `x-admin-token` header.

## Architecture

- **No framework, no build step.** Plain `.html` pages in root served statically by Express (`server.js`), which also exposes the admin API and lead capture.
- **Two parallel admin UIs — know which one you are editing:**
  - `/admin` → `admin/index.html`, multi-page app with split modules in `admin/js/` (`auth`, `editor` ~40KB, `leads`, `media`, `settings`, `history`, `toast`). This is what the server console advertises.
  - `/admin.html` → legacy single-page monolith driven by root `admin-panel.js` (~71KB). `start-admin.bat` opens this one. View switching: `showView()` wraps internal `showTab()`.
- Dark theme via CSS custom properties in `styles.css` (~3.7K lines). Vanilla JS only.

## Key files

| File | Purpose |
|------|---------|
| `server.js` | Express app (~900 lines): all `/api/admin/*` routes, leads, page save, spare parts CRUD |
| `admin-panel.js` | Legacy monolithic admin UI (iframe WYSIWYG via `contentEditable`, injects `data-jmd-edit` attributes; CRM, media, settings, spare parts) |
| `script.js` | Public site JS: navbar scroll, mobile menu, hero slider, IntersectionObserver scroll-reveal (`reveal-up` class — not a library), lead form → `POST /api/submit-lead` |
| `site-settings.js` | Auto-generated config snapshot (`window.JMD_CONFIG`) loaded at bottom of every page; merges localStorage overrides at runtime |
| `styles.css` | Global theme CSS; written in place by the admin theme editor |
| `spare-parts.js` | Public e-commerce page logic (cart, filters, search) |
| `data/spare-parts.js` | ~806KB, `const parts = [...]` loaded globally via `<script>` on `spare-parts.html` (no export) |

## Backend auth & env

- JWT auth: `POST /api/admin/login`. Token accepted from `x-admin-token` header or httpOnly `jmd_admin` cookie. Sessions 2h; remember-me 30d.
- `JWT_SECRET` falls back to a legacy dev secret if unset in dev mode — **not present in `.env.example`**.
- Password: on startup, bcrypt-hashes `process.env.ADMIN_PASSWORD` (min 6 characters required).
- Login lockout after 5 failures/IP, 30 min cooldown — **in-memory only**, resets on restart.
- SMTP endpoints (`/api/admin/test-smtp`, `/api/admin/send-email`) read `GMAIL_USER`/`GMAIL_PASS`, but `.env.example` documents `SMTP_EMAIL`/`SMTP_PASSWORD` which nothing reads — set `GMAIL_*` or those endpoints always fail.
- `CALLMEBOT_*` vars in `.env.example` are unused by server.js.

## API surface

- Admin-only (`adminAuth`): pages list/create/save (+30-version history under `data/versions/<page>/`, restore), content field saves → `data/content.json`, leads CRUD/bulk/export, media upload(base64)/delete/mkdir/rename into `public/uploads/`, settings (also writes `robots.txt`), todos, backup/restore, sitemap generation, save-theme, spare-parts CRUD.
- **Public unauthenticated:** `POST /api/submit-lead`, `GET /api/content`, `POST /api/save-cms`, and legacy `GET /api/leads` (returns all leads — don't add sensitive data assumptions here).

## Spare parts data constraint

`data/spare-parts.js` is parsed by bracket-slicing + `JSON.parse` (`parseSpareParts()` in server.js) and **rewritten wholesale on every CRUD operation**:
- Everything between `[` … `]` must be strictly valid JSON — no comments, no trailing commas.
- New parts get `image: '/images/parts/<lowercased code>.jpg'`.

## Quirks

- `POST /api/admin/save-theme` regex-replaces `:root` variables in `styles.css` in place and appends custom CSS between `/* === CUSTOM ADMIN CSS === */` / `/* === END CUSTOM ADMIN CSS === */` markers. Markers only exist once custom CSS has been saved — if present, don't remove them.
- `site-content.js` exists but is **not loaded by any HTML page** (despite a server comment claiming public pages use it) — content saved to `/api/admin/content` is not applied client-side anywhere.
- Every `.html` request sync-writes `data/stats.json` (visitor-tracking middleware).
- **`node_modules/` is committed to git** (`.gitignore` contains only `.env`); runtime data in `data/*.json` is committed too.
- No test runner, linter, type checker, or formatter configured. Verify changes by running the server and exercising pages manually.

## Public pages

15 `.html` files in root sharing nav/mobile-menu/footer markup: `index.html` (hero slider, lineup grid, spare parts section); model pages `nexus-st`, `magnus-ex`, `magnus-grand`, `magnus-gmax`, `magnus-neo`, `reo-80`, `reo-li`; `models.html`; `spare-parts.html`; `contact.html`, `dealer.html`, `test-ride.html`, `savings.html`.

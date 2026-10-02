# 🚀 Jai Mata Di Auto — Production Deployment & Infrastructure Guide

This guide details the complete production architecture, deployment workflows, DNS mapping, SSL configuration, data persistence, and rollback strategies for the decoupled Jai Mata Di Auto platform.

---

## 🏛️ System Architecture

```
                    ┌────────────────────────────────────────┐
                    │               DNS / Edge               │
                    │         (Cloudflare / Registrar)       │
                    └───────────────────┬────────────────────┘
                                        │
                 ┌──────────────────────┴──────────────────────┐
                 │                                             │
                 ▼                                             ▼
        https://jaimatadiauto.in                    https://api.jaimatadiauto.in
    ┌───────────────────────────────┐             ┌───────────────────────────────┐
    │       FRONTEND (Static)       │             │       BACKEND (Node API)      │
    │   Cloudflare Pages / Netlify  │             │     Render / Railway / VPS    │
    ├───────────────────────────────┤             ├───────────────────────────────┤
    │ • 14 HTML Showcase Pages      │   REST /    │ • Express 4 REST API          │
    │ • Normalized Assets (CSS/JS)  │   Cookies   │ • Cookie-based Admin Auth     │
    │ • Canonical Modular Admin UI  ├────────────►│ • Lead Capture & CRM Engine   │
    │ • config.js (API client)      │             │ • Spare Parts CRUD API        │
    └───────────────────────────────┘             └───────────────┬───────────────┘
                                                                  │
                                                  ┌───────────────▼───────────────┐
                                                  │       PERSISTENT STORAGE      │
                                                  │       (Mounted Disk / SSD)    │
                                                  ├───────────────────────────────┤
                                                  │ /data    (leads, settings)    │
                                                  │ /uploads (dealer images)      │
                                                  └───────────────────────────────┘
```

---

## 1. 🌐 Frontend Deployment (Cloudflare Pages / Netlify)

The frontend is 100% static HTML, CSS, JavaScript, and media assets located in `jmd/frontend/`. It requires **zero build step**, delivering instant TTFB and global CDN caching.

### Option A: Cloudflare Pages (Recommended)
1. Log in to your Cloudflare Dashboard and navigate to **Workers & Pages** > **Create application** > **Pages**.
2. Connect your Git repository (`shivammanojnirmal/jmd-admin-cms`).
3. Set the build configuration:
   - **Framework preset:** `None`
   - **Build command:** *(leave empty)*
   - **Build output directory:** `jmd/frontend`
   - **Root directory:** *(leave empty or set to repository root)*
4. Click **Save and Deploy**.
5. Assign your custom domain: **Custom domains** > **Set up a domain** > `jaimatadiauto.in`.

### Option B: Netlify (Git or Drag & Drop)
1. In Netlify, click **Add new site** > **Import an existing project**.
2. Select your Git repository.
3. In **Base directory**, enter: `jmd/frontend`.
4. Leave **Build command** empty.
5. In **Publish directory**, enter: `.` (or leave blank).
6. Click **Deploy Site**, then configure `jaimatadiauto.in` in **Domain Management**.

### Frontend API Configuration
Open `jmd/frontend/config.js` and verify that the production API base URL points to your backend:
```javascript
window.JMD_API_BASE = 'https://api.jaimatadiauto.in';
```
*(In local development, `config.js` automatically falls back to `http://localhost:3000` when on localhost).*

---

## 2. ⚙️ Backend Deployment (Render / Railway / VPS)

The backend is an Express REST API located in `jmd/backend/`.

### Critical Prerequisite: Persistent Storage
The backend persists leads in `data/leads.json`, content in `data/content.json`, and media in `uploads/`. On ephemeral platforms (e.g. standard Render web services or Heroku), container restarts will wipe unmounted files. **You must attach a persistent disk.**

---

### Option A: Render (Web Service + Persistent Disk)
1. In the Render Dashboard, create a **New Web Service**.
2. Connect your GitHub repository.
3. Configure the service:
   - **Name:** `jmd-backend-api`
   - **Region:** Singapore or India (closest to users)
   - **Root Directory:** `jmd/backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
4. Attach Persistent Disk:
   - Navigate to **Disks** > **Add Disk**.
   - **Mount Path:** `/var/data`
   - Create symlinks or mount directly: map `jmd/backend/data` and `jmd/backend/uploads` to the persistent mount path.
5. Add Environment Variables (see Section 3).

---

### Option B: Ubuntu / Debian VPS with PM2 (Full Control)
For maximum reliability, cost savings, and data ownership:

```bash
# 1. Clone repository to server
cd /var/www
git clone https://github.com/shivammanojnirmal/jmd-admin-cms.git
cd jmd-admin-cms/jmd/backend

# 2. Install production dependencies
npm install --omit=dev

# 3. Create .env file with secrets
nano .env

# 4. Start backend with PM2 process manager
npm install -g pm2
pm2 start server.js --name "jmd-api" --time
pm2 save
pm2 startup

# 5. Configure Nginx Reverse Proxy & SSL
sudo nano /etc/nginx/sites-available/api.jaimatadiauto.in
```

**Nginx Configuration Template:**
```nginx
server {
    server_name api.jaimatadiauto.in;

    client_max_body_size 25M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable SSL via Certbot:
```bash
sudo certbot --nginx -d api.jaimatadiauto.in
```

---

## 3. 🔑 Environment Variables Reference

Create a secure `.env` file in `jmd/backend/.env`:

| Variable | Recommended Production Value | Purpose |
|---|---|---|
| `NODE_ENV` | `production` | Enables Express production optimizations and secure cookies |
| `PORT` | `3000` | Local port Express listens on behind the proxy |
| `FRONTEND_ORIGIN` | `https://jaimatadiauto.in` | Whitelisted origin for CORS and CSRF validation |
| `COOKIE_DOMAIN` | `.jaimatadiauto.in` | Enables seamless cookie sharing between frontend and API |
| `JWT_SECRET` | *32+ random characters* | Cryptographic signing key for admin JWTs |
| `ADMIN_PASSWORD` | *Strong password* | Fallback admin password (auto-hashed with bcrypt) |
| `GMAIL_USER` | `your-email@gmail.com` | SMTP email for dealer lead alert notifications |
| `GMAIL_PASS` | `xxxx xxxx xxxx xxxx` | Google App Password (16 characters) |

---

## 4. 🌍 DNS & Domain Configuration

Configure the following records in your DNS manager (e.g. Cloudflare DNS, GoDaddy):

| Type | Host / Name | Target / Value | TTL | Proxy Status |
|---|---|---|---|---|
| `CNAME` | `@` (or `jaimatadiauto.in`) | `your-site.pages.dev` (or Netlify URL) | Auto | Proxied (Orange Cloud) |
| `CNAME` | `www` | `jaimatadiauto.in` | Auto | Proxied |
| `CNAME` | `api` | `jmd-backend.onrender.com` (or VPS IP via `A` record) | Auto | DNS Only / Proxied |

### Cross-Subdomain Cookie Configuration
Because the frontend runs on `jaimatadiauto.in` and the backend on `api.jaimatadiauto.in`:
1. The backend automatically sets the cookie attribute:
   ```javascript
   domain: process.env.COOKIE_DOMAIN || '.jaimatadiauto.in',
   sameSite: 'lax',
   secure: true,
   httpOnly: true
   ```
2. The browser automatically attaches this cookie to requests sent to `api.jaimatadiauto.in` whenever `credentials: 'include'` is used.

---

## 5. 💾 Automated Data Backup & Restoration

Before every deployment or server upgrade, back up the backend database files:

### Running Manual Backup
```bash
node jmd/backend/scripts/backup-data.js
```
*This creates a timestamped zip/directory snapshot in `jmd/backend/backups/backup-YYYY-MM-DD/` containing `data/leads.json`, `data/settings.json`, and `data/spare-parts.js`.*

### Automated Daily Cron Backup (VPS)
Add to crontab (`crontab -e`):
```bash
0 3 * * * node /var/www/jmd-admin-cms/jmd/backend/scripts/backup-data.js >> /var/log/jmd-backup.log 2>&1
```

### Restoring from Backup
```bash
# 1. Stop backend service
pm2 stop jmd-api

# 2. Copy backed-up JSON files back to data/
cp /var/www/jmd-admin-cms/jmd/backend/backups/backup-2026-10-02/leads.json /var/www/jmd-admin-cms/jmd/backend/data/

# 3. Restart backend service
pm2 restart jmd-api
```

---

## 6. 🔄 Rollback Procedures

### Frontend Rollback
1. **Cloudflare Pages / Netlify:** Navigate to **Deployments** in your dashboard, find the previously working deployment, and click **Rollback to this deployment**. Rollback completes in under 5 seconds globally.

### Backend Rollback
1. In your VPS or Git deployment:
   ```bash
   git log --oneline -n 5
   git checkout <PREVIOUS_WORKING_COMMIT_HASH>
   npm install --omit=dev
   pm2 restart jmd-api
   ```
2. Verify system health:
   ```bash
   curl -I https://api.jaimatadiauto.in/api/health
   # Expected response: HTTP/2 200 OK
   ```

---

## 7. 📦 Spare Parts Catalog Deployment & Maintenance

### Fresh Server Deployment
On a fresh clone or new server deployment, the complete spare parts catalog is immediately active and operational because:
- `jmd/backend/data/spare-parts.json` (2,964 parts) and `jmd/backend/data/price-list-meta.json` are **tracked directly in git**.
- A newly provisioned container or VPS does **not** need the original Excel file (`.xlsx`), nor does it require running the importer script during boot.
- The committed `spare-parts.json` file contains strictly sanitized, public catalog data (`id`, `name`, `code`, `model`, `modelSlug`, `hsn`, `price`, `category`, `stock`, `featured`, `description`, `image`, `aliases`, `needsVerification`).
- Internal operational notes and conflict logs are stored in `jmd/backend/data/spare-parts-internal.json`, which is untracked and ignored by `.gitignore`.
- Private customer data (`leads.json`), runtime configurations (`settings.json`), and audit trails (`activity.json`, `loginAttempts.json`) remain strictly git-ignored.

### How an Admin Updates the Catalog Later
When a revised OEM price list is issued by Ampere / Greaves Electric Mobility:

1. **Upload / Place Workbook:**
   Copy the updated Excel spreadsheet to `jmd/backend/data-imports/ALL_VEHICLES_PRICE_LIST_Retail_Main.xlsx` (this directory is git-ignored to prevent accidental binary leakage).

2. **Run Dry-Run Audit:**
   Execute the automated parser and conflict detector:
   ```bash
   node jmd/backend/scripts/import-price-list.js
   ```
   Review the generated audit reports in `audit-output/pricelist/`:
   - `summary.md`: high-level summary of additions, price shifts, and flagged items.
   - `price-changes.csv`: line-by-line delta for all modified parts.
   - `flagged.csv`: cross-model price spreads, duplicate checks, and LH/RH pair differences.

3. **Apply the Update Atomically:**
   ```bash
   node jmd/backend/scripts/import-price-list.js --apply
   ```
   This atomically updates `jmd/backend/data/spare-parts.json` and refreshes `price-list-meta.json`.

4. **Run Verification & Regression Tests:**
   ```bash
   npm run test:backend
   node jmd/backend/tests/test_public_api_leak.js
   ```

5. **Commit the Public Catalog to Git:**
   ```bash
   git add jmd/backend/data/spare-parts.json jmd/backend/data/price-list-meta.json
   git commit -m "feat(catalog): import updated spare parts price list [YYYY-MM-DD]"
   git push origin main
   ```

6. **Ad-Hoc Real-Time Price & Stock Edits:**
   Authorized dealership staff can also update single part prices, clear verification badges, and toggle stock availability in real time via the web admin portal (`/admin/spare-parts.html`) without re-running the importer.


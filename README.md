# 🛵 Jai Mata Di Auto — EV Dealership Platform

Modern electric vehicle dealership web platform and content management system for **Jai Mata Di Auto**, authorized Ampere EV dealer in Vasai-Virar, Maharashtra.

---

## 🏛️ Architecture Overview

The repository is organized into a clean, decoupled architecture:

```
jmd/
  frontend/          # Static website & canonical modular Admin CMS
    assets/          # Normalized CSS, JS, images, brochures, and offline spare parts
    admin/           # Canonical modular Admin SPA/MPA (Spare Parts, CRM, CMS)
    config.js        # Universal API client configuration (window.JMD_API_BASE)
    *.html           # 14 public showcase and lead-generation pages
  backend/           # Modular Express REST API
    src/             # Routes (auth, leads, media, content, spare-parts), middleware, services
    data/            # Isolated data store (leads.json, settings.json, spare-parts.js)
    uploads/         # Media upload storage (protected, nosniff headers)
    server.js        # Backend entrypoint (Port 3000)
    .env.example     # Backend environment template
docs/                # Project documentation, deployment guides, and migration logs
archive/             # Preserved legacy and scratch assets (ignored by git)
```

---

## ⚡ Quick Start

### Windows (One-Click)
Double-click `start-dev.bat` or run in PowerShell:
```cmd
.\start-dev.bat
```
*Automatically checks dependencies, opens `http://localhost:5173` in your browser, and starts both backend and frontend.*

### Cross-Platform (macOS / Linux / Windows)
```bash
# 1. Install dependencies
npm install

# 2. Configure backend environment
cp jmd/backend/.env.example jmd/backend/.env

# 3. Launch complete development stack
npm run dev
```

Both services will start concurrently:
- **Frontend & Admin UI:** [http://localhost:5173](http://localhost:5173)
- **Admin Login:** [http://localhost:5173/admin/login.html](http://localhost:5173/admin/login.html)
- **Backend API:** [http://localhost:3000](http://localhost:3000)
- **API Health Check:** [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## 🛠️ Individual Commands

| Command | Description |
|---|---|
| `npm run dev` | Runs backend (:3000) and frontend (:5173) concurrently |
| `npm run dev:backend` | Starts only the backend Express API server |
| `npm run dev:frontend` | Starts only the lightweight frontend dev server |
| `npm run test:backend` | Runs the 17-point backend isolation and security test suite |
| `npm run test:smoke` | Runs the end-to-end separation smoke test suite |

---

## 🔐 Security & Data Isolation
- **Private Data:** Database files in `jmd/backend/data/` and server source code are never served over HTTP (verified 404).
- **Repository Hygiene:** Runtime customer data (`jmd/backend/data/*.json`), customer media uploads (`jmd/backend/uploads/`), and environment secret files (`.env`) are strictly ignored and never committed to git. See `jmd/backend/.env.example` and `jmd/backend/data/*.example.json` for bootstrapping templates.
- **Session Auth:** Authenticated admin sessions utilize `httpOnly`, `sameSite: 'lax'` cookies with `credentials: 'include'`. Non-browser API clients can optionally pass `x-admin-token`.
- **CORS & CSRF:** Strict CORS domain whitelisting and custom header validation protect all state-changing endpoints.
- **Rate Limiting & Honeypots:** Rate-limiting blocks brute force attacks and silent honeypots discard bot spam.

---

## 📚 Documentation
- 📖 [Deployment & Hosting Guide](docs/DEPLOY.md)
- 📋 [Migration & Separation History Log](docs/MIGRATION_LOG.md)
- 📊 [Separation Verification Report](docs/SEPARATION_REPORT.md)

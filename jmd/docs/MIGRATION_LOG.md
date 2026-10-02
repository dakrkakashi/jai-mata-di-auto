# 📋 Jai Mata Di Auto — Migration & Separation Log

**Log Date:** October 2, 2026  
**Repository Branch:** `main`

---

## 1. Archived Unnecessary Files (Step 1 Cleanup)

The following scratch files, obsolete documentation, browser caches, and delete-candidates were relocated to [archive/](file:///d:/Shivam%20Project/StartUp%20Project/Jai%20Mata%20Di%20Auto%20Website/jai_mata_di_auto-copy/archive/) to declutter the codebase while preserving them for safety:

| Original Path | Archived Location | Description / Purpose |
|---|---|---|
| `node` | `archive/node` | 0-byte rogue file in root |
| `jmd-admin-cms@1.0.0` | `archive/jmd-admin-cms@1.0.0` | 0-byte rogue file in root |
| `extract_pdfs.py` | `archive/extract_pdfs.py` | One-off Python script for PDF extraction |
| `product-sections-html.txt` | `archive/product-sections-html.txt` | Scratch raw HTML snippet dump |
| `append-builder.js` | `archive/append-builder.js` | One-off DOM append scratch script |
| `fix-all.js` | `archive/fix-all.js` | One-off fix scratch script |
| `update_pages.js` | `archive/update_pages.js` | One-off page injection scratch script |
| `components/` | `archive/components/` | Unused experimental React/TSX files (`blackhole-hero-section.tsx`, `demo.tsx`) |
| `design-system/` | `archive/design-system/` | Redundant nested scratch design-system documentation |
| `emailjs-config.js` | `archive/emailjs-config.js` | Unused third-party EmailJS configuration |
| `firebase-config.js` | `archive/firebase-config.js` | Unused third-party Firebase configuration |
| `images/images.rar` | `archive/images.rar` | Binary RAR archive of images |
| `edge-profile/` | `archive/edge-profile/` | Edge browser automation profile cache |
| `edge-profile2/` | `archive/edge-profile2/` | Edge browser automation profile cache |
| `graphify-out/` | `archive/graphify-out/` | Graphify knowledge graph cache |
| `ANIMATION_ENHANCEMENTS_v4.md` | `archive/ANIMATION_ENHANCEMENTS_v4.md` | Legacy animation enhancement guide |
| `CHANGES_MADE_QUICK_REFERENCE.md`| `archive/CHANGES_MADE_QUICK_REFERENCE.md`| Legacy quick reference notes |
| `CODEBASE_ANALYSIS.md` | `archive/CODEBASE_ANALYSIS.md` | Legacy codebase analysis document |
| `COMPLETE_ENHANCEMENT_SUMMARY.md`| `archive/COMPLETE_ENHANCEMENT_SUMMARY.md`| Legacy enhancement summary |
| `CSS_OPTIMIZATION_GUIDE.md` | `archive/CSS_OPTIMIZATION_GUIDE.md` | Legacy CSS optimization guide |
| `FIREBASE_EMAILJS_SETUP.md` | `archive/FIREBASE_EMAILJS_SETUP.md` | Legacy setup notes |
| `IMAGE_OPTIMIZATION_GUIDE.md` | `archive/IMAGE_OPTIMIZATION_GUIDE.md` | Legacy image optimization guide |
| `ISSUES_SUMMARY.md` | `archive/ISSUES_SUMMARY.md` | Legacy issues summary notes |
| `MASTER_INDEX.md` | `archive/MASTER_INDEX.md` | Legacy master index guide |
| `PRODUCT_ILLUSTRATIONS_GUIDE.md`| `archive/PRODUCT_ILLUSTRATIONS_GUIDE.md`| Legacy product illustrations notes |
| `UI_ILLUSTRATIONS_GUIDE.md` | `archive/UI_ILLUSTRATIONS_GUIDE.md` | Legacy UI illustrations guide |


---

## 2. Retired Monolithic Admin Panel & Ported Canonical UI (Step 2)

Per user approval, `/admin` (modular MPA) has been established as the single canonical admin UI. All missing features from the monolithic admin (`/admin.html`) were ported into `/admin/spare-parts.html` and `/admin/js/spare-parts.js`, and cookie/token auth unified in `admin/js/api.js` and `admin/js/auth.js`.

The monolithic admin files were retired and safely archived into [archive/retired-monolith-admin/](file:///d:/Shivam%20Project/StartUp%20Project/Jai%20Mata%20Di%20Auto%20Website/jai_mata_di_auto-copy/archive/retired-monolith-admin/):

| Original Path | Archived Location | Ported Replacement / Status |
|---|---|---|
| `admin.html` | `archive/retired-monolith-admin/admin.html` | Retired; replaced by modular `admin/*.html` pages |
| `admin-panel.js` | `archive/retired-monolith-admin/admin-panel.js` | Retired (72 KB monolith); spare parts CRUD ported to `admin/js/spare-parts.js` |
| `admin-panel.css` | `archive/retired-monolith-admin/admin-panel.css` | Retired; unified styling under `admin/css/admin.css` |
| `admin-editor.js` | `archive/retired-monolith-admin/admin-editor.js` | Retired; modern editor is `admin/js/editor.js` |
| `admin-editor.css` | `archive/retired-monolith-admin/admin-editor.css` | Retired; modern editor styles in `admin/css/editor.css` |
| `start-admin.bat` | `archive/retired-monolith-admin/start-admin.bat` | Retired; replaced by root `start-dev.bat` in Step 5 |

---

## 3. Target Structure Reference

```
jmd/
  frontend/
    assets/
      css/
      js/
      images/
      docs/
    admin/
      css/
      js/
      *.html
    config.js
    *.html
  backend/
    src/
      routes/
      middleware/
      services/
      config/
      app.js
    data/          (private CRM & spare parts data)
    uploads/       (private uploads)
    scripts/
    server.js
    package.json
    .env.example
  docs/
    MIGRATION_LOG.md
    DEPLOY.md
    SEPARATION_REPORT.md
  README.md
  .gitignore
```

# Large Files & Asset Hosting Guide

## Overview

In accordance with repository hygiene best practices and GitHub file size limitations (warning threshold at 50 MB, hard block at 100 MB), large original uncompressed source binaries are kept outside version control.

## Web-Optimized Asset Management

### 1. High-Resolution Dealership Banner
- **Original Source:** Camera photo `4624 x 3472 px` (8.05 MB) archived outside git tracking.
- **Tracked Web Copy:** Optimized to `1920 x 1442 px` (476 KB, quality ~55) at `jmd/frontend/assets/images/misc/jmd-photo.jpeg`.

### 2. Vehicle Brochures
- **Nexus Brochure:** Original 55.66 MB PDF replaced with web-compressed 12.29 MB edition at `jmd/frontend/assets/docs/updated-nexus-brochure.pdf`.
- **Magnus Neo Brochure:** Original 22.29 MB PDF replaced with web-compressed 0.45 MB edition at `jmd/frontend/assets/docs/magnus-neo-brochure.pdf`.
- Both brochure links resolve with HTTP 200 on all model pages.

## Verification Checklist
- Maximum tracked file size in repository: **12.29 MB** (Nexus brochure).
- Zero files exceeding GitHub's 25 MB/50 MB warning thresholds.
- Total repository size: ~56 MB.

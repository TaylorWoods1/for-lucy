# Cycle Companion

A private, mobile-first PWA to track cycle phases and get supportive partner tips.

## Quick start

Serve the folder over HTTP (required for service worker and modules):

```bash
cd cycle-companion
python3 -m http.server 8080
```

Open `http://localhost:8080` on your phone (same Wi‑Fi) or use [Add to Home Screen](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable) for an app-like experience.

## Usage

1. Log when her period started (onboarding or **Period started today**).
2. Open anytime to see the current phase, days until next period, and support tips.
3. The app learns her average cycle length after a few logged starts (defaults to 28 days).

## Privacy

All data stays in your browser's local storage. Nothing is sent to a server.

## Files

| File | Purpose |
|------|---------|
| `index.html` | App shell |
| `app.js` | UI and interactions |
| `cycle.js` | Phase math and predictions |
| `storage.js` | localStorage adapter (cloud-ready) |
| `tips.js` | Phase-specific support copy |
| `sw.js` | Offline service worker |
| `manifest.json` | PWA install metadata |

## Deploy

Upload the `cycle-companion/` folder to any static host (Netlify, GitHub Pages, Cloudflare Pages). No build step needed.

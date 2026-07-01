# For Lucy · Cycle Companion

A private, mobile-first PWA to track cycle phases and get supportive partner tips.

**Live:** [taylorwoods1.github.io/for-lucy](https://taylorwoods1.github.io/for-lucy/)

## Features

- Cycle phase dashboard with progress and partner tips
- Predicted upcoming period dates (learns average cycle length over time)
- GMT+10 calendar dates via `Australia/Brisbane`
- Local-only storage — nothing leaves the device
- Installable PWA with offline shell
- **PWA-only access** — the app is blocked in the browser and only runs when opened from the home screen

## Quick start

```bash
npm ci
npm run verify    # lint, format, test, audit
python3 -m http.server 8080
```

Open `http://localhost:8080`. Use Chrome or Safari for the best PWA experience.

> **Note:** With `CONFIG.pwa.requireInstall` enabled (default), local dev in a browser tab shows the install gate instead of the dashboard. To test the full UI in a desktop browser temporarily, set `requireInstall: false` in `js/config.js`, or use Chrome DevTools → Application → Manifest → "Add to home screen" / simulate standalone display mode.

## Project structure

```text
js/
  config.js          # Central configuration (single source of truth)
  app.js             # Bootstrap
  lib/               # Pure domain logic (dates, cycle, storage)
  content/           # Static content (tips)
  ui/                # View components (onboarding, dashboard, toast)
css/styles.css
tests/               # Vitest unit tests
sw.js                # Service worker (ES module)
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design details.

## Scripts

| Command          | Purpose                                          |
| ---------------- | ------------------------------------------------ |
| `npm test`       | Run unit tests                                   |
| `npm run lint`   | ESLint                                           |
| `npm run format` | Prettier check                                   |
| `npm run verify` | Full quality gate (lint + format + test + audit) |

## Privacy

All cycle data is stored in `localStorage` on the user's device. No analytics, accounts, or backend.

## Deployment

Pushes to `main` run CI, then deploy to the `gh-pages` branch via GitHub Actions. Dev tooling files are excluded from the published site.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

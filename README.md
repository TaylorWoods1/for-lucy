# For Lucy · Cycle Companion

A private, mobile-first PWA to track cycle phases and get supportive partner tips.

**Live:** [taylorwoods1.github.io/for-lucy](https://taylorwoods1.github.io/for-lucy/)

## Features

- Cycle phase dashboard with progress and partner tips
- Self-learning predictions — recency-weighted cycle length, a ± day confidence window that narrows as cycles are logged, and a self-reported accuracy line
- Week-ahead outlook with the next phase transition called out
- Period end logging (learns average period length over time)
- Daily partner tips keyed to the cycle day, led by a single "today's focus"
- History panel to remove mislogged entries; predictions recalculate instantly
- Backup export/import (JSON) and full data delete — all still local-only
- GMT+10 calendar dates via `Australia/Brisbane`
- Local-only storage — nothing leaves the device
- Installable PWA with offline shell
- **Mobile + PWA only** — desktop browsers are blocked; on phone, the app only runs when opened from the home screen

## Quick start

```bash
npm ci
npm run verify    # lint, format, test, audit
python3 -m http.server 8080
```

Open `http://localhost:8080`. Use Chrome or Safari for the best PWA experience.

> **Note:** With `CONFIG.platform.requireMobile` and `CONFIG.pwa.requireInstall` enabled (default), desktop browsers see a mobile-only gate. On mobile, a browser tab shows the install gate instead of the dashboard. To test locally, use Chrome DevTools device emulation with a phone user agent and simulate standalone display mode, or temporarily disable the flags in `js/config.js`.

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

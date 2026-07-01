# For Lucy · Cycle Companion

A private, mobile-first PWA to track cycle phases and get supportive partner tips.

**Live:** [taylorwoods1.github.io/for-lucy](https://taylorwoods1.github.io/for-lucy/)

## Features

- Cycle phase dashboard with progress and partner tips
- Predicted upcoming period dates (learns average cycle length over time)
- GMT+10 calendar dates via `Australia/Brisbane`
- Local-only storage — nothing leaves the device
- Installable PWA with offline shell

## Quick start

```bash
npm ci
npm run verify    # lint, format, test, audit
python3 -m http.server 8080
```

Open `http://localhost:8080`. Use Chrome or Safari for the best PWA experience.

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

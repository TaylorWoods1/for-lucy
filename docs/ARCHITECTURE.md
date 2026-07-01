# Architecture

## Overview

For Lucy is a static Progressive Web App with no production build step. ES modules are served directly to the browser.

## Layers

| Layer   | Location                      | Responsibility                                         |
| ------- | ----------------------------- | ------------------------------------------------------ |
| Config  | `js/config.js`                | App name, timezone, defaults, cache version, selectors |
| Domain  | `js/lib/`                     | Date math, cycle predictions, localStorage adapter     |
| Content | `js/content/`                 | Static copy (partner tips)                             |
| UI      | `js/ui/`                      | DOM rendering, toast, view components                  |
| Shell   | `index.html`, `css/`, `sw.js` | Layout, styles, offline caching                        |

## Data flow

```text
localStorage → Storage → cycle/dates lib → UI components → DOM
```

## Timezone model

All calendar dates use the IANA timezone `Australia/Brisbane` (GMT+10, no DST). The `dates` module is the only place that formats or parses dates for display and logic.

## Security

- Content Security Policy restricts scripts and styles to `'self'`
- Dynamic HTML uses `escapeHtml` before insertion
- No third-party scripts or trackers
- Service worker uses network-first caching for updates

## Testing strategy

Unit tests cover pure domain logic (`dates`, `cycle`, `storage`, `dom` utilities). UI rendering is kept thin and delegates to tested libraries.

## Scalability notes

The storage adapter is designed so a future sync layer could wrap `Storage` methods without changing UI code. Cycle prediction logic accepts explicit `todayIso` parameters for testability and future timezone overrides.

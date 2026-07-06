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

## Prediction model

Predictions are transparent statistics, not a black box:

- **Cycle length** — recency-weighted mean of logged intervals (`CONFIG.prediction.recencyFactor` per step back in time), so recent cycles matter more than old ones.
- **Confidence window** — derived from the standard deviation of intervals and shown as a ± day chip. Fewer than 3 intervals reports a "learning" state with a wide window.
- **Accuracy** — computed retroactively: each logged interval is compared against the weighted average of the intervals before it, and the recent worst-case error is reported ("last 3 predictions within ±1 day").
- **Period length** — learned from logged end dates once the "period ended" action is used; defaults until then.

All learned values are recomputed from raw history on every render — the stored data stays minimal (start/end dates plus settings), so corrections to history immediately correct everything derived from it.

## Scalability notes

The storage adapter is designed so a future sync layer could wrap `Storage` methods without changing UI code. Cycle prediction logic accepts explicit `todayIso` parameters for testability and future timezone overrides.

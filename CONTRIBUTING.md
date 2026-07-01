# Contributing

Thank you for helping improve For Lucy.

## Development setup

1. Clone the repository
2. Run `npm ci`
3. Run `npm run verify` before every commit
4. Serve locally with `python3 -m http.server 8080`

## Quality standards

All changes must pass:

- **ESLint** — no lint errors
- **Prettier** — consistent formatting
- **Vitest** — unit tests for domain logic
- **npm audit** — no moderate+ vulnerabilities

Run everything with:

```bash
npm run verify
```

## Architecture guidelines

- **Config** — add constants to `js/config.js`, not scattered magic values
- **Domain logic** — pure functions in `js/lib/` with JSDoc
- **UI** — rendering in `js/ui/`; escape all dynamic HTML via `escapeHtml`
- **Tests first** — add or update tests in `tests/` for logic changes
- **No build step** — production remains vanilla ES modules

## Pull requests

- Keep diffs focused
- Update README/docs when behaviour changes
- Ensure CI passes on GitHub Actions

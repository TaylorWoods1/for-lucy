# For Lucy · Cycle Companion

A gentle, private cycle tracking companion made for Lucy. Track your period, cycle phases, and daily wellbeing — all stored locally in your browser.

**Live site:** [taylorwoods1.github.io/for-lucy](https://taylorwoods1.github.io/for-lucy/)

## Features

- **Cycle dashboard** — see your current cycle day, phase, and predicted next period
- **Calendar view** — period, fertile window, and ovulation highlighted at a glance
- **Daily check-ins** — log mood, symptoms, and notes
- **Private by default** — all data stays in your browser via localStorage
- **Export & reset** — download your data or clear it anytime from settings

## Getting started

1. Open the app and tap the settings icon
2. Enter your last period start date, cycle length, and period length
3. Save — your calendar and phase insights will update automatically
4. Use **Today's check-in** to log how you're feeling each day

## Local development

This is a static site — no build step required.

```bash
# Serve locally (Python 3)
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Deployment

The site deploys automatically to the `gh-pages` branch when changes are merged to `main`, via `.github/workflows/deploy.yml`.

**One-time setup** (repo admin required):

1. Go to [github.com/TaylorWoods1/for-lucy/settings/pages](https://github.com/TaylorWoods1/for-lucy/settings/pages)
2. Under **Build and deployment**, set **Source** to **Deploy from a branch**
3. Choose branch **`gh-pages`** and folder **`/ (root)`**
4. Save — the site will be live at the URL above within a minute or two

## Privacy

No accounts, no servers, no analytics. Your cycle data never leaves your device unless you choose to export it.

---

Made with care 🌸

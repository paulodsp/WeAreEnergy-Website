# We Are Energy Co-operative — Website Developer Guide

**weareenergy.coop** · GitHub → Cloudflare Pages · Bootstrap 5.3.8 backbone · Custom design system

---

## Overview

This is a static HTML website deployed via Cloudflare Pages from the `main` branch of the GitHub repository. There is no build step, no framework, and no Node dependencies. Every page is a standalone `.html` file. All shared behaviour lives in two JavaScript files and one CSS file.

The site uses a dark/light theme system, a custom design token architecture built on top of Bootstrap 5.3.8, and a live data hydration system that pulls Ofgem price cap figures from a JSON file updated quarterly.

---

## Repository Structure

```
WeAreEnergy-Website/
├── index.html              ← Homepage
├── about.html              ← About the co-operative
├── faqs.html               ← FAQs + inline savings calculator
├── invest.html             ← Investment / join page
├── calculator.html         ← Standalone savings calculator
├── thankyou.html           ← Post-signup confirmation
├── press.html              ← Press & media (draft)
│
├── css/
│   └── we-dark.css         ← ALL custom styles. Single source of truth.
│
├── js/
│   ├── wae.js              ← Site-wide script. Load on every page.
│   └── calcs.js            ← Calculator logic. Load on all pages.
│
├── data/
│   ├── ofgem.json          ← ⚡ QUARTERLY UPDATE REQUIRED — Ofgem price cap data
│   └── wae-model.json      ← Model rate data. Changes on deliberate model review only.
│
├── images/                 ← Site images (webp preferred)
├── fonts/                  ← Oswald Stencil custom font
├── documents/              ← Downloadable PDFs
│
├── CNAME                   ← weareenergy.coop (Cloudflare)
├── site.webmanifest        ← PWA manifest
└── .gitignore
```

**Files that no longer exist and should not be referenced:**
- `scroll-animations-REFINED.css` — retired, functionality moved into `we-dark.css`
- `scroll-effects.js` / `scroll-animations.css` — original Guardian-era GSAP files, retired
- `index-modern.html` — prototype only, never deployed
- `we-v3.4 base.css` — legacy, superseded by `we-dark.css`

---

## Deployment

The `main` branch is connected directly to Cloudflare Pages. Any push to `main` triggers an automatic deploy to `weareenergy.coop`. There is no staging environment — test locally before merging.

**Local development:**
```bash
cd WeAreEnergy-Website
python -m http.server 8000
# Visit http://localhost:8000
```
Do not open HTML files directly from the filesystem (`file://`) — the `data/` JSON fetch will fail due to browser CORS restrictions. Always use a local server.

**Deployment checklist before pushing to main:**
- Test at desktop (1280px+) and mobile (375px) in both light and dark mode
- Check the calculator works and figures update correctly
- Verify all accordion items open and close with correct borders
- Confirm no console errors

---

## Architecture

### CSS — `we-dark.css`

This is the single CSS file for the entire site. It contains:

1. **Design tokens** — CSS custom properties for all colours, typography, spacing, and surface variants
2. **Dark / light theme** — all tokens are defined under `[data-theme="dark"]` and `[data-theme="light"]` with `prefers-color-scheme` as the system default
3. **Bootstrap overrides** — targeted overrides for navbar, accordion, cards, and forms
4. **Component styles** — hero, calculator, cards, buttons, sections, footer, etc.
5. **Scroll and reveal animations** — IntersectionObserver-driven (no GSAP dependency)
6. **Reduced motion** — all animations are suppressed via `prefers-reduced-motion`

**The golden rule: no inline styles on HTML elements.** All styling belongs in `we-dark.css`. If you find yourself writing `style="..."` on an element, create a CSS class instead.

### Brand Colour Tokens

| Token | Value | Usage |
|---|---|---|
| `--chartreuse` | #c0d726 | Primary brand accent, CTAs, highlights |
| `--charcoal` | #373838 | Dark backgrounds, text on light |
| `--cream` | #f1eee6 | Light backgrounds, text on dark |
| `--coral` | #F26B5B | Secondary accent, Year 1 saving value on light sections |
| `--chartreuse-line` | rgba of chartreuse | Dividers on dark sections |
| `--line-color` | context-aware | Dividers, accordion borders |
| `--text-main` | context-aware | Primary text (resolves to cream on dark, charcoal on light) |
| `--text-soft` | context-aware | Secondary / body text |

Section background classes: `.section-charcoal`, `.section-cream`, `.section-chartreuse`. All tokens resolve correctly within each section context — do not override token values inline.

### Fonts

| Font | Source | Usage |
|---|---|---|
| Oswald | Google Fonts CDN | Headings, kickers, nav, buttons |
| Oswald Stencil | `fonts/oswald-stencil.otf` | Hero display text only |
| System sans-serif | Fallback only | Never used as primary |

### JavaScript — `wae.js`

Loaded on every page immediately before `</body>`. Handles:

1. **Theme toggle** — reads `localStorage` for saved preference, falls back to `prefers-color-scheme`. Applies `data-theme` attribute to `<html>`.
2. **Footer year** — auto-populates `<span id="yr">` with the current year.
3. **Hero image fade-in** — adds `.loaded` class to `.hero-photo` after 80ms.
4. **Scroll progress bar** — drives `#scrollProgress` element via `scaleX` transform.
5. **Reveal on scroll** — IntersectionObserver watches `.reveal` elements and adds `.visible` class.
6. **Text highlight** — IntersectionObserver watches `.highlight` elements and adds `.on` class after a 450ms delay.
7. **Counter animation** — animates `.counter[data-to]` elements from 0 to their target value on scroll. Supports `data-fmt="comma"` for formatted numbers.
8. **Ofgem data hydration** — fetches `data/ofgem.json` and populates `[data-field]` elements site-wide. See the Data section below.
9. **Nav close on link click** — collapses the Bootstrap mobile navbar when a nav link is tapped.

### JavaScript — `calcs.js`

Loaded on every page. Guards all execution with `if (document.getElementById('calc-slider'))` so it exits immediately on pages without a calculator. Handles the interactive savings calculator: slider input, preset buttons, live Ofgem rate fetching, Year 1 / 10-year / 25-year savings calculations, and share button behaviour.

---

## Data & Figures — Quarterly Update Process

### How it works

All live Ofgem figures displayed on the website are driven by `data/ofgem.json`. The JavaScript in `wae.js` fetches this file once on page load and populates any HTML element carrying a `data-field` attribute.

### Supported `data-field` values

| Attribute value | What it shows | Example |
|---|---|---|
| `period` | Current quarter label | Q2 2026 |
| `unit_rate` | Unit rate in p/kWh | 24.67 |
| `standing` | Standing charge p/day | 57.21 |
| `saving10` | 10-year saving in £ | 8,300 |
| `saving25` | 25-year saving in £ | 38,000 |

Animated counters that reference live figures use `data-field-to="saving10"` or `data-field-to="saving25"` alongside the `counter` class. The hydration script overwrites their `data-to` attribute before the animation fires.

### What to update each quarter (every January, April, July, October)

**Step 1 — Update `data/ofgem.json`:**

```json
{
  "quarter": "Q3 2026",
  "period": "July to September 2026",
  "source_url": "https://www.ofgem.gov.uk/...",
  "updated": "2026-07-01",
  "next_review": "2026-10-01",
  "gb_average": {
    "unit_rate_p": [NEW RATE],
    "standing_charge_p_day": [NEW STANDING CHARGE],
    "annual_cap_gbp": [NEW ANNUAL CAP],
    "tdcv_kwh": 2700
  }
}
```

Source: [Ofgem price cap unit rates and standing charges](https://www.ofgem.gov.uk/information-consumers/energy-advice-households/energy-price-cap-unit-rates-and-standing-charges)

**Step 2 — Update `page_stats` in `ofgem.json` only if the model has been rerun:**

The `saving_10yr_gbp` and `saving_25yr_gbp` values in `page_stats` are the published rounded figures from the WAE financial model. These do **not** change quarterly — only when the underlying model is deliberately reviewed. When the model is updated, edit both `wae-model.json` (for reference and audit trail) and `ofgem.json page_stats` (which the website reads).

**Step 3 — Check the calculator locally:**

Open the calculator on a local server and verify the Ofgem rate, standing charge, and period label display correctly.

**Step 4 — No HTML edits required** for a standard quarterly rate update. All figures on all pages update automatically.

### Figures that are NOT driven by JSON

The following headline numbers are hardcoded in HTML because they are brand editorial statements, not live Ofgem data. They change only when the business model is reviewed:

- Hero sub-headline savings figures (e.g. "Over £6,500 saved in the first 10 years")
- "50% off during the first 8 years. Free power thereafter."
- Calculator section heading display values (£7,849 / 10yr, £35,937 / 25yr)
- CO₂ figures in editorial copy

When the model is reviewed and `page_stats` in `ofgem.json` is updated, search all HTML files for the old published figures and update them manually at the same time.

> **Pending (May 2026):** The post-lease savings methodology covering years 9–25 is under review. Published figures of £8,300 (10yr) and £38,000 (25yr) are likely to increase significantly once the corrected model is confirmed. When Paul confirms the revised figures, update `ofgem.json page_stats` AND search all HTML files for hardcoded instances.

---

## Adding or Editing Pages

### Page template structure

Every page follows this structure:

```html
<!doctype html>
<html lang="en" data-theme="dark">
<head>
  <!-- 1. Charset, viewport, title, meta description -->
  <!-- 2. Favicon links -->
  <!-- 3. Google Tag Manager script (inline, in <head>) -->
  <!-- 4. Structured data / JSON-LD (if applicable) -->
  <!-- 5. Google Fonts (Oswald) preconnect + stylesheet -->
  <!-- 6. Bootstrap 5.3.8 CSS CDN -->
  <!-- 7. we-dark.css -->
</head>
<body>
  <!-- Google Tag Manager noscript (immediately after <body>) -->

  <!-- Navbar (copy from any existing page) -->

  <!-- Page content in <section> elements -->

  <!-- Footer (copy from any existing page) -->

  <!-- Bootstrap 5.3.8 JS bundle CDN -->
  <!-- wae.js -->
  <!-- calcs.js -->
</body>
</html>
```

### Section backgrounds

Use section wrapper classes to control the colour context. All design tokens resolve automatically within each context:

```html
<section class="section section-charcoal">   <!-- Dark charcoal background -->
<section class="section section-cream">      <!-- Off-white cream background -->
<section class="section section-chartreuse"> <!-- Brand green background -->
<section class="section section-tight section-charcoal"> <!-- Reduced vertical padding -->
```

### Reveal animations

Add `.reveal` to any element to fade it in on scroll. Optional stagger delays:

```html
<div class="reveal">Fades in on scroll</div>
<div class="reveal reveal-d1">100ms delay</div>
<div class="reveal reveal-d2">200ms delay</div>
<div class="reveal reveal-d3">300ms delay</div>
```

### Live data fields

To display a live Ofgem figure anywhere on a page:

```html
Current quarter: <span data-field="period">Q2 2026</span>
Unit rate: <span data-field="unit_rate">24.67</span>p/kWh
```

The text content is the fallback displayed before the JSON loads. Always set it to the current known value.

### Animated counters

```html
<!-- Static counter -->
<span class="counter" data-to="16" data-fmt="comma">16</span>

<!-- Counter whose target value comes from ofgem.json -->
<span class="counter" data-to="8300" data-fmt="comma" data-field-to="saving10">8,300</span>
```

---

## Theme System

The site supports dark and light mode. The `data-theme` attribute on `<html>` controls which token set is active. `wae.js` sets this on load based on the user's saved preference (`localStorage`) or system `prefers-color-scheme`.

All pages default to `data-theme="dark"` in the HTML attribute to prevent a flash of unstyled content before `wae.js` fires.

The toggle button requires the `data-theme-toggle` attribute:

```html
<button data-theme-toggle aria-label="Switch to light mode" title="Switch to light mode">
  <span aria-hidden="true">☀️</span>
</button>
```

---

## Bootstrap Integration

Bootstrap 5.3.8 is loaded via CDN on every page. The site uses Bootstrap's grid, navbar, accordion, form controls, and utility classes. Custom CSS overrides Bootstrap using scoped section selectors (e.g. `.section-charcoal .accordion`) rather than `!important`.

There are only 4 instances of `!important` in the entire codebase — three inside `prefers-reduced-motion` (correct and necessary) and one Bootstrap navbar background override (acceptable). This count should not grow.

**Do not** add additional Bootstrap JavaScript plugins — all required JS is in the bundle already loaded.

---

## Google Tag Manager

GTM container `GTM-NPSRW5F` is active on all pages. The GTM script appears in `<head>` and the `<noscript>` iframe appears immediately after `<body>`. The iframe carries a required `style="display:none;visibility:hidden"` inline style — this is mandated by Google and must not be moved to CSS.

---

## Known Issues & Pending Work (May 2026)

| Item | File(s) | Priority |
|---|---|---|
| Several inline `style=""` attributes remain on non-GTM elements — should be CSS classes | `about.html`, `faqs.html`, `thankyou.html`, `press.html` | Medium |
| Accordion CSS has duplicate concrete property overrides alongside Bootstrap variable overrides | `we-dark.css` | Low |
| `press.html` section border uses `--cream-line` token as inline style | `press.html` | Low |
| Referral code display uses inline `letter-spacing` | `thankyou.html` | Low |
| Years 9–25 post-lease savings figures under review — published numbers likely to increase | `ofgem.json`, all HTML pages | Awaiting confirmed model figures |

---

## Design Principles

- **One CSS file.** All styles in `we-dark.css`. No new CSS files without strong justification.
- **No inline styles.** No `style=""` attributes on content elements. GTM iframes are the only permitted exception.
- **Tokens, not values.** Use `var(--chartreuse)` not `#c0d726`. Use `var(--text-main)` not a hardcoded colour.
- **Bootstrap first.** If Bootstrap already does it, use Bootstrap. Write custom CSS only for things Bootstrap cannot do.
- **Data-driven figures.** Quarterly Ofgem numbers come from `data/ofgem.json`. Never hardcode Ofgem rates in HTML.
- **No CDN animation libraries.** Scroll animations use native IntersectionObserver and CSS transitions. No GSAP or similar dependencies.
- **Semantic HTML.** Use `<section>`, `<nav>`, `<header>`, `<footer>`, `<h1>`–`<h3>` correctly. One `<h1>` per page.
- **British English throughout.** Co-operative (not cooperative), colour (not color), organisation, realise.
- **Accessibility.** All interactive elements must be keyboard-navigable. Colour contrast must meet WCAG AA. Every image must have `alt` text.

---

## Contacts & Access

- **Repository:** GitHub (WeAreEnergy-Website)
- **Hosting:** Cloudflare Pages — auto-deploys on push to `main`
- **Domain:** weareenergy.coop (CNAME managed in Cloudflare)
- **Analytics:** Google Tag Manager `GTM-NPSRW5F`
- **Press contact:** press@weareenergy.coop

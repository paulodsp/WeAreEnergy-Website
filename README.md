# We Are Energy Co-operative — Website Developer Guide

**weareenergy.coop** · GitHub → Cloudflare Pages · Bootstrap 5.3.8 backbone · Custom design system

---

## Overview

This is a static HTML website deployed via Cloudflare Pages from the `main` branch of the GitHub repository. There is no build step, no framework, and no Node dependencies. Every page is a standalone `.html` file. All shared behaviour lives in JavaScript files and one central CSS file.

The site uses a dark/light theme system, a custom design token architecture built on top of Bootstrap 5.3.8, and a site-wide **Single Source of Truth** data hydration architecture (`data/ofgem.json`) that dynamically populates inline stats, calculator inputs, and animated counter targets across all pages on load.

---

## Repository Structure

```text
WeAreEnergy-Website/
├── index.html              ← Homepage
├── about.html              ← About the co-operative
├── faqs.html               ← FAQs + inline savings calculator
├── invest.html             ← Investment / join page
├── calculator.html         ← Standalone savings calculator
├── thankyou.html           ← Post-signup confirmation
├── press.html              ← Press & media page
│
├── inject_facts.py         ← 🐍 Python AST tagging tool for Single Source of Truth
│
├── css/
│   └── we-dark.css         ← ALL custom styles. Single source of truth.
│
├── js/
│   ├── wae.js              ← Site-wide script. Theme, scroll animations, data-fact hydration.
│   └── calcs.js            ← Calculator logic. Reads baseline figures directly from ofgem.json.
│
├── data/
│   ├── ofgem.json          ← ⚡ SINGLE SOURCE OF TRUTH — Ofgem price cap & model facts master
│   └── wae-model.json      ← Financial model rate data & audit trails.
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

## Deployment & Local Development

The `main` branch is connected directly to Cloudflare Pages. Any push to `main` triggers an automatic deploy to `weareenergy.coop`. There is no staging environment — test locally before merging. For instant changes, go to Cloudflare and purge cache for the relevant page(s).

**Local development server:**
```bash
cd WeAreEnergy-Website
python -m http.server 8000
# Visit http://localhost:8000
```
*Note:* Always use a local server instead of opening HTML files directly via `file://` to prevent browser CORS restrictions on `data/ofgem.json`.

**Deployment checklist before pushing to main:**
- Test at desktop (1280px+) and mobile (375px) in both light and dark mode
- Check the calculator works and figures update correctly
- Verify all accordion items open and close with correct borders
- Confirm no console errors

---

## Single Source of Truth & Hydration Pipeline

Every statistic, percentage, financial figure, and counter target across the site flows from **`data/ofgem.json`**.

### 1. Tagging Pipeline (`inject_facts.py`)
`inject_facts.py` is a Python script using `BeautifulSoup` AST parsing to scan static HTML text nodes and scroll counters without breaking HTML structure, comments, or tag nesting.

* **Dry run preview:** `python3 inject_facts.py --run-dry`
* **In-place execution:** `python3 inject_facts.py`

### 2. Supported Attributes & Format Specifiers

HTML elements are tagged using two primary attributes:
* **`data-fact="path.key"`**: Hydrates inline prose text elements (e.g., `programme.phase1_mw`).
* **`data-fact-to="path.key"`**: Sets dynamic target values for animated `.counter` elements.

**Format Specifiers (`data-fmt`):**

| `data-fmt` | Output Example | Description |
|---|---|---|
| `gbp` | £8,800 | Currency rounded to integer |
| `pct` | 70% | Percentage value |
| `comma` | 40,212 | Comma-separated integer |
| `comma_plus` | 40,212+ | Comma-separated integer with plus suffix |
| `mw` / `gw` | 120MW / 4GW | Capacity units |
| `gbpbn` / `gbpm` | £570bn / £265m | Financial scale abbreviations |
| `mtco2` | 2.7 MtCO₂e | Carbon metric emissions |
| `dec1` | 12.5 | Decimal precision to 1 place |

### 3. Whitespace & Accordion Formatting Rules
To prevent words collapsing together (e.g., `the8years` inside accordion headers or prose), always ensure explicit spaces exist outside `<span>` tags or use standard non-breaking spaces (`&nbsp;`):

```html
What happens to my bills after the <span data-fact="page_stats.term_years" data-fmt="num">8</span> years?
```

---

## Architecture & Design Tokens

### CSS — `we-dark.css`

This is the single CSS file for the entire site. It contains:
1. **Design tokens** — CSS custom properties for all colours, typography, spacing, and surface variants.
2. **Dark / light theme** — all tokens are defined under `[data-theme="dark"]` and `[data-theme="light"]`.
3. **Bootstrap overrides** — targeted overrides for navbar, accordion, cards, and forms.
4. **Scroll animations** — IntersectionObserver-driven (no GSAP dependency).

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

### Fonts

| Font | Source | Usage |
|---|---|---|
| Oswald | Google Fonts CDN | Headings, kickers, nav, buttons |
| PT Serif | Google Fonts CDN | Body, Captions |
| Oswald Stencil | `fonts/oswald-stencil.otf` | Hero display text only |

---

## JavaScript Architecture

### `js/wae.js` (Site-wide Core)
Loaded on every page before `</body>`. Handles:
1. **Single Source Hydration:** Asynchronously fetches `data/ofgem.json` on DOM load, parses deep key paths (`getValByPath`), and hydrates all `[data-fact]` spans and `.counter[data-fact-to]` targets site-wide.
2. **Scroll Counter Animations:** IntersectionObserver triggers counters smoothly when scrolled into view using live JSON targets.
3. **Theme & UI:** Manages dark/light theme persistence, sticky CTAs, hero fades, and navbar collapse handlers.

### `js/calcs.js` (Interactive Calculator)
Loaded on pages containing `#calc-slider`. Initializes calculation baselines directly from `data/ofgem.json`:
* Pulls `ofgem_gb_average.unit_rate_p`, `standing_charge_p_day`, and `wae_model_basis.baseline_kwh`.
* Dynamically recalculates 1-year, 10-year, and 25-year bill savings based on real-time user slider adjustments.

---

## Quarterly Update Process

When Ofgem updates price cap figures (January, April, July, October):

1. Edit `data/ofgem.json` with the new GB average rates (`unit_rate_p`, `standing_charge_p_day`, `quarter`, etc.).
2. Update the hardcoded `OFGEM_FALLBACK` variables in `js/wae.js` and `FALLBACK` in `js/calcs.js`.
3. Test locally using `python -m http.server 8000`.
4. Commit and push to `main`:
   ```bash
   git add .
   git commit -m "Update Ofgem price cap baseline data in data/ofgem.json"
   git push origin main
   ```

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

- **One CSS File:** All styles in `we-dark.css`. No new CSS files without strong justification.
- **No Inline Styles:** No `style=""` attributes on content elements (GTM iframe is the sole exception).
- **Tokens Over Values:** Use `var(--chartreuse)` and `var(--text-main)`.
- **Single Source Data:** Quarterly numbers and financial figures come from `data/ofgem.json`.
- **No CDN Animation Libraries:** Scroll animations use native IntersectionObserver and CSS transitions.
- **British English:** Co-operative, colour, organisation, realise.

---

## Contacts & Access

- **Repository:** GitHub (WeAreEnergy-Website)
- **Hosting:** Cloudflare Pages — auto-deploys on push to `main`
- **Domain:** weareenergy.coop (CNAME managed in Cloudflare)
- **Analytics:** Google Tag Manager `GTM-NPSRW5F`
- **Press contact:** press@weareenergy.coop
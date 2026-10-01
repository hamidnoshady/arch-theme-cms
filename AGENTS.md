<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Graphite theme — UX / typography

## Font architecture

```
Shazde WOFF2 (public/fonts/, four UI cuts)
        ↓
next/font/local  →  --font-shazde
next/font/google (Inter)  →  --font-inter
        ↓
tokens.css (--font-ui, --font-brand, scale, semantic weights)
        ↓
typography.css (.text-display, .text-body, …)
        ↓
layout / page CSS (consume tokens, not raw 300/500/13px)
```

- **Use `next/font/local` for Shazde.** Do not manually `<link rel="preload">` unless a concrete limitation is documented.
- **Register four product weights only:** 300, 400, 500, 600 (`APPLICATION_SHAZDE_WEIGHTS` in `src/lib/fonts.ts`). Files 700–900 may exist on disk for future brand use but must not appear in application UI without an explicit design-system change.
- **Locale stacks:**
  - `html[lang='fa']`: `--font-ui` = Shazde → Vazirmatn fallback (`data-fonts='fallback'` uses Vazirmatn only).
  - `html[lang='en']`: `--font-ui` = Inter → system-ui (not Shazde for body/nav).
  - **`--font-brand`** is separate from **`--font-ui`** (wordmark / lockup uses brand; defaults to Shazde when licensed files are present).
- Do not force Shazde onto English UI because it contains Latin glyphs; validate Latin quality before changing this rule.

## Hierarchy rule

**Prefer size + color over extra weights.** Weight must not be the main hierarchy mechanism.

The product exposes **four normal weights** (300–600). **700–900 are exceptional marketing weights** and must not be introduced into application UI without an approved design-system use case.

## Size standards (Persian-first)

| Role | Token / class | Min size | Weight role |
|------|----------------|----------|-------------|
| Display XL | `--text-display` / `.text-display` | fluid | `--text-display-weight` |
| H1 | `--text-h1` / `.text-h1` | 28–40px mobile | `--text-h1-weight` |
| H2 | `--text-h2` | 20–30px mobile | `--text-heading-weight` |
| H3 | `--text-h3` | 16–22px mobile | `--text-heading-weight` |
| Body large | `--text-body-lg` | 17–18px | `--text-body-weight` |
| Body | `--text-body` | 16px | `--text-body-weight` |
| UI / nav / button | `--text-ui` / `.text-ui` | **14px** (13–15 desktop) | `--text-label-weight` |
| Label | `--text-label` | **13–14px** | `--text-label-weight` |
| Meta | `--text-meta` | **12–13px** | `--text-body-weight` |
| Micro | `--text-micro` | 11–12px | rare / copyright only |

- **Interactive UI minimum:** 13–14px (`--text-ui`, `--text-label`). **12px** only for secondary metadata (`--text-meta`).
- **Avoid 10px** except genuinely nonessential legal/copyright (`--text-micro` at 11px is the floor in tokens).
- **Persian body** uses slightly more line-height than English (`--leading-body` 1.8 vs 1.7 on `html[lang='fa']` / `en`). `--leading-body-lg` follows the same rule and is *not* a third value: a taller lead paragraph reads as a separate, airier block than the copy under it.
- **Do not apply global letter-spacing to Persian.** Tracking is for Latin brand lockup only (`.logo__wordmark` calibration under `data-fonts='shazde'`). Roles that can hold either language consume `--tracking-label` (0.04em) or `--tracking-ui` (0.02em); `html[lang='fa']` zeroes both.

### Compact step (≤640px)

The same roles, one notch down, at the low end of each band above — a phone is one
column with one thumb, so a size that reads as generous on a 1440px canvas reads as a
wall of type on a 390px one. The step lives in `tokens.css` (one `@media` block) so the
whole system moves together; components never write their own mobile sizes.

| Role | Wide canvas | ≤640px |
|------|-------------|--------|
| Page title | `--text-title` → display (~72px) | → `--text-h1` (28px) |
| Section heading | `--text-section` → h1 (~56px) | → `--text-h2` (21px) |
| Page intro heading | `--text-standfirst` → h2 | → `--text-h3` (17px) |

The step sits at the **low** end of the bands above, one notch under the band floor where a
phone needs it: a 32px title on a 390px canvas is a third of the width before the first line
of content. `tokens.css` is the only place that decides this.

- **Statement rungs keep a ~1.3 ratio at every width.** `--text-display` (3.6vw) and `--text-h1` (2.75vw) climb on the same slope, so a page title never collides with the section headings beneath it mid-range — the tablet band is where a steeper display curve used to shout.
- The display scale itself is absent on a phone: a phone has no statement moment.
- Guardrails: `src/lib/typography-policy.test.ts` checks the step's values against these bands, the title/section ratio across widths, and that tracking goes through tokens.

## Implementation rules for agents

1. Add or change typography in **`src/styles/tokens.css`** and semantic classes in **`src/styles/typography.css`** first.
2. Components use **`var(--text-*)`**, **`var(--leading-*)`**, and **`var(--text-*-weight)`** — not raw `font-weight: 500` or `font-size: 13px` in feature CSS.
3. No **`Helvetica` / `Arial`** stacks in `src/` unless explicitly exempted in this file.
4. **`font-family`:** use `--font-ui` for product UI and `--font-brand` for logo/wordmark only.
5. Automated guardrails: `src/lib/typography-policy.test.ts` (run via `npm test`).

## Verification checklist (manual + computed)

Do not treat “font file appeared in Network” as sufficient.

- [ ] Grep `src/` for `font-family` — no forbidden stacks.
- [ ] Grep styles for `font-weight` outside approved tokens (no 700–900 in component CSS).
- [ ] **Computed** `font-family` and **computed** `font-weight` in DevTools for: display heading, body paragraph, nav link, button, form label.
- [ ] Confirm **no fake/synthetic weights** (e.g. requesting 650 must map to a real `@font-face`, not browser interpolation).
- [ ] Script/glyph coverage: Persian, Latin, Persian numerals, punctuation, parentheses, currency, Arabic, mixed FA/EN.
- [ ] Mixed-direction QA string (render in UI or Story-style fixture):

  `سفارش #INV-2048 — Dell Latitude 5431 — ۱۲۵٬۰۰۰ تومان`

- [ ] Hard refresh / throttled network: no FOIT/FOUT layout jump.
- [ ] Viewports: 320px, 375px, tablet, desktop; **200% zoom**.
- [ ] Long FA and EN labels in nav/buttons do not clip; forms inherit typography.

## Eshobe CMS integration (Graphite theme)

- **Customer identity** comes from `GET /api/site` (`name`, optional `branding`). Never hardcode Graphite as the tenant name in metadata, footer, or accessible labels.
- **Navigation** for header, mobile menu, and homepage destinations uses `GET /api/header` (footer: `GET /api/footer`). Do not revive hardcoded `SECTIONS` for customer-facing menus.
- **Content bindings**: routes are theme-owned, content is bound. Look pages/categories up through `getHomePage` / `getSectionPage` / `getSectionCategories` (`src/lib/cms.ts`), which apply the rules in `src/lib/theme/sections.ts` — bound id first, section-key slug only when nothing is bound. Never call `getPageBySlug('about' | …)` from a view, sitemap or nav; that is the hardcoding this replaced.
- **Runtime presentation** (`introAnimation`, `introDuration`, `showSectionNumbers`, `mapStyle`) comes from `site.themeRuntime.settings` plus manifest defaults — not deployment env.
- **Formatting and slugs** use `@eshobe/site-runtime` (`vendor/site-runtime` until npm publish). `eshobe.theme.json` `contractVersion` must match the package.
- **Visitor `/api/*` proxy** must not forward `Authorization`, cookies, or the site API key.
- **The theme ships no logo.** The home intro mark is the tenant's uploaded SVG/raster: `branding.homeLogo` if the CMS sends it, else `branding.logo` (`src/components/brand/Logo.tsx`). With none uploaded the site name is set as a wordmark. Do not add demo artwork back into `src/` or `public/`.
- **Sections are category-backed or page-backed.** Projects, Education and Blog are Posts filed under a bound root category (`ENTRY_KINDS` in `src/lib/theme/sections.ts`); adding another means a content slot in `eshobe.theme.json`, an entry in `SECTION_SLOT`, `SECTIONS`, and copy in `src/lib/i18n.ts`.
- **Motion:** the home stage animates `--p` through one rAF loop and the stylesheet reads it in transform/opacity only. Global polish lives in `src/styles/motion.css`; smooth scrolling is `scroll-behavior` on `<html>` plus `data-scroll-behavior="smooth"` so Next skips it on route changes.
- **A rule that draws in starts at the reading edge.** Use `transform-origin: var(--origin-inline-start)`. `inline-start` is not a valid `transform-origin` value, so writing it directly fails silently and grows the rule outward from its centre; the token is zeroed in for RTL in `tokens.css`.
- **Page changes get one acknowledgement:** the 2px route rule (`RouteProgress.tsx`, rendered outside `.shell` so the drawer's push cannot drag it). It starts on link activation, never claims to finish (it fills to 92% over `--route-dur`), and is drawn on width alone — opacity is not transitioned — because a prefetched route can commit before the `pending` phase has rendered. Its resting geometry is a visible stub, not `scaleX(0)`: a transition out of zero spends its first frames a few pixels wide, so the acknowledgement reads as a speck at the corner exactly when the page changes fastest. It sits below `env(safe-area-inset-top)`, like the header it shares a top edge with (`viewport-fit=cover` is on). Never re-introduce a debounce: the rule exists to say the press landed.

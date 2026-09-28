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
| H1 | `--text-h1` / `.text-h1` | 32–40px mobile | `--text-h1-weight` |
| H2 | `--text-h2` | 24–30px mobile | `--text-heading-weight` |
| H3 | `--text-h3` | 18–22px mobile | `--text-heading-weight` |
| Body large | `--text-body-lg` | 17–18px | `--text-body-weight` |
| Body | `--text-body` | 16px | `--text-body-weight` |
| UI / nav / button | `--text-ui` / `.text-ui` | **14px** (13–15 desktop) | `--text-label-weight` |
| Label | `--text-label` | **13–14px** | `--text-label-weight` |
| Meta | `--text-meta` | **12–13px** | `--text-body-weight` |
| Micro | `--text-micro` | 11–12px | rare / copyright only |

- **Interactive UI minimum:** 13–14px (`--text-ui`, `--text-label`). **12px** only for secondary metadata (`--text-meta`).
- **Avoid 10px** except genuinely nonessential legal/copyright (`--text-micro` at 11px is the floor in tokens).
- **Persian body** uses slightly more line-height than English (`--leading-body` 1.8 vs 1.7 on `html[lang='fa']` / `en`).
- **Do not apply global letter-spacing to Persian.** Tracking is for Latin brand lockup only (`.logo__wordmark` calibration under `data-fonts='shazde'`).

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

- **Customer identity** comes from `GET /api/site` (`name`, optional `branding`). Never hardcode Graphite as the tenant name in metadata, footer, or accessible labels. The Graphite SVG is a **demo fallback** only.
- **Navigation** for header, mobile menu, and homepage destinations uses `GET /api/header` (footer: `GET /api/footer`). Do not revive hardcoded `SECTIONS` for customer-facing menus.
- **Content bindings** live in `src/lib/theme/bindings.ts` with manifest slug hints in `eshobe.theme.json`. Do not scatter legacy slug assumptions elsewhere.
- **Runtime presentation** (`introAnimation`, `introDuration`, `showSectionNumbers`, `mapStyle`) comes from `site.themeRuntime.settings` (legacy `runtimeSettings` fallback) plus manifest defaults — not deployment env.
- **Formatting and slugs** use `@eshobe/site-runtime` (`vendor/site-runtime` until npm publish). `eshobe.theme.json` `contractVersion` must match the package.
- **Visitor `/api/*` proxy** must not forward `Authorization`, cookies, or the site API key.

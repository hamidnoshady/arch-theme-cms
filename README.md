# Graphite — Architecture Office

A bilingual portfolio theme for the Eshobe CMS (**Theme API `contractVersion = 1`**). Persian is the default locale and is unprefixed; English lives under `/en`. The homepage is a single fixed screen: a constructed logo, then one bounded gesture that reveals CMS-driven destinations. Interior pages share one editorial system.

## Develop

```bash
npm ci
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

Pages render on each request (`force-dynamic`). `ESHOBE_API_KEY` is read at runtime, never during the build.

### Environment

| Variable | Purpose |
| --- | --- |
| `ESHOBE_CMS_URL` | CMS origin. Alias: `ESHOBE_API_URL`. |
| `ESHOBE_API_KEY` | Site credential. Runtime only. Alias: `ESHOBE_SITE_API_KEY`. |
| `ESHOBE_SITE_DOMAIN` | Customer hostname. Sent as `Host` so the CMS can resolve the tenant. |
| `ESHOBE_PUBLIC_ORIGIN` | Where this deployment is actually reachable (preview host ≠ customer domain). |
| `ESHOBE_REVALIDATE_SECRET` | HMAC key for `POST /api/revalidate`. |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | Optional override for media URLs. |

Without a CMS the site still renders with **Graphite demo branding**; customer identity always comes from `GET /api/site` when connected.

## CMS integration

| Concern | Source |
| --- | --- |
| Site name, logos, favicon, default OG | `GET /api/site` → `name` and optional `branding` |
| Header / footer navigation | `GET /api/header`, `GET /api/footer` |
| Design tokens | `GET /api/site` → `theme` (mapped via `@eshobe/site-runtime` `themeCss`) |
| Runtime presentation settings | `GET /api/site` → `themeRuntime.settings` (legacy `runtimeSettings` supported); defaults in `eshobe.theme.json` |
| Content bindings | `GET /api/site` → `themeRuntime.bindings` (legacy `bindings` supported); manifest slug fallbacks |
| Blocks allowlist | `GET /api/site` → `blocks` |

Production deploys use the public GHCR image `ghcr.io/hamidnoshady/arch-theme-cms` at an immutable digest (`eshobe.theme.json` → `deployment.strategy: registry_image`). CI pushes the image and registers each digest with Eshobe CMS. Set GitHub Actions secrets `ESHOBE_CMS_URL`, `ESHOBE_THEME_PACKAGE_ID`, and `ESHOBE_THEME_ARTIFACT_SECRET` for artifact registration, then sync the theme package in the CMS so it picks up the manifest.

### Content model

**URLs belong to the theme; content belongs to the customer.** `/about`, `/services`, `/contact`, `/projects` and `/education` are fixed routes, so navigation, sitemap and the mobile menu never depend on what somebody typed as a slug. What each route *shows* is whatever the site owner chose in the CMS «تنظیمات پوسته» (a `contentSlots` binding, delivered as `GET /api/site` → `themeRuntime.bindings`). A page may be called `درباره-ما`; it still renders at `/about`, and any link to it by its own slug redirects there.

| Route | Filled by (binding) | Used when nothing is bound |
| --- | --- | --- |
| `/` (home) | `homePage` | page slug `home` |
| `/about` · `/services` · `/contact` | `aboutPage` · `servicesPage` · `contactPage` | page whose slug is `about` / `services` / `contact` |
| `/projects` · `/education` | posts under the `projectsCategory` · `educationCategory` root; its child categories are filters | category whose slug is `projects` / `education` |

- A bound page with **no translation** in the requested locale is treated as missing (`fallbackLocale=false` on every read) — the theme never swaps in an unrelated page that shares a slug.
- The slug fallback is a **first-run convenience** for a freshly provisioned site, not a second opinion beside a binding.
- Every lookup goes through `getHomePage` / `getSectionPage` / `getSectionCategories` in `src/lib/cms.ts`, driven by the pure rules in `src/lib/theme/sections.ts`. Navigation, routes, sitemap and the office map share them.
- Adding a section means: a `contentSlots` entry in `eshobe.theme.json`, a row in `SECTION_SLOT`, and a route case — nothing else knows slot names.

| Other content | Source |
| --- | --- |
| Header / footer menus | `GET /api/header`, `GET /api/footer` (CMS pages are linked by id, so a bound page always lands on its section URL) |
| Project facts | Structured CMS project metadata when available; else first `Label: Value` bullet list |
| Office map | Structured coordinates on contact blocks when available; else safe map URL parsing |
| Contact form | `formBlock` proxied via `/api/form-submissions` |

## Runtime package

This theme depends on **`@eshobe/site-runtime`** (vendored under `vendor/site-runtime` until the package is published to npm). `eshobe.theme.json` `contractVersion` must match `contractVersion` from that package — enforced in `src/lib/manifest.test.ts` and `GET /api/health`.

Locale path helpers (`localeHref`, `dirFor`) live in `src/lib/locale.ts` (platform parity with eshobe-cms `src/lib/locales.ts`).

## Deploy

`eshobe.theme.json` is the Wave 11 manifest: `proxiesApi`, `deployment.strategy: registry_image`, `build.buildPack: dockerfile` (see root `Dockerfile`), and `/api/health`. After a CMS sync, preview and production pull `ghcr.io/hamidnoshady/arch-theme-cms@sha256:…` — not a mutable tag.

The container runs the Next.js **standalone** bundle (`node server.js` in the Dockerfile). `GET /api/health` is ready only when the CMS answers `GET /api/site` with a matching `contractVersion` (use `?live` for process-only probes).

`/api/*` except health and revalidate is proxied to the CMS without the site API key. Server-side reads attach the key and `Host`.

`POST /api/revalidate` verifies `x-eshobe-signature` on the **raw body**, then invalidates the `cms` cache tag, optional semantic `tags` / `resources`, and mapped paths.

## Fonts and the mark

- **Shazde** for Persian UI when licensed files exist under `public/fonts/`; **Inter** for English UI; Vazirmatn fallback.
- The Graphite vector mark remains the **theme demo fallback** when the CMS provides no logo.

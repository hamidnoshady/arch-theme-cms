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
| Runtime presentation settings | `GET /api/site` → `themeRuntime.settings`; defaults in `eshobe.theme.json` |
| Content bindings | `GET /api/site` → `themeRuntime.bindings`; manifest slug fallbacks |
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
| Project facts | `projectMetadata` on the post (`src/lib/project-metadata.ts`); legacy first `Label: Value` bullet list only when that group is empty, never shown twice |
| Office map | Structured coordinates on contact blocks when available; else safe map URL parsing |
| Contact form | `formBlock`; `POST /api/form-submissions` validates against the form read with the site key, then forwards anonymously |

### Content states

Every route says which of these it is in, and each has an action to go on:

| State | When | Visitor sees |
| --- | --- | --- |
| available | the document exists in this locale | the page |
| missing translation | the other locale has it | a notice with a link to that version, contact, projects, home |
| empty | nothing bound or published | an empty state with the same next steps |
| upstream error | the CMS timed out, 5xx'd or rate-limited | the error page (HTTP 500) with a retry — never "nothing published" |
| missing | unknown slug | a real HTTP 404 (malformed escapes get a 400 in `src/proxy.ts`) |

Content routes deliberately have **no `loading.tsx`**: a streaming boundary above `[...slug]` commits a 200 before the route can call `notFound()`. The home skeleton lives in a `(home)` route group so it wraps only `/` and `/en`.

Menus (header, footer, home stage) are one validated model (`src/lib/navigation.ts`): read without locale fallback, an item needs a label and a target in the visitor's language, author-typed paths like `/projects` are localized (`/en/projects`), and a section route is listed only when it has content in that language.

### Visitor `/api/*`

`src/app/api/[...path]` is an allowlist: `GET|HEAD /api/site` and `/api/media/file/<name>`. Everything else is a 404 — the CMS keeps `/api/*` closed on customer domains and the theme does not reopen it.

### QA against a mock CMS

```bash
node scripts/mock-cms.mjs --port 4010          # modes: ok | down | slow | form-fail | sparse
ESHOBE_CMS_URL=http://127.0.0.1:4010 ESHOBE_SITE_DOMAIN=arch.local ESHOBE_API_KEY=test npm run build && npx next start -p 3100
```

The mock reproduces Payload's localization (`fallbackLocale`), depth population, `where` filters and drafts, with deliberately uneven bilingual content (an untranslated page, a Persian-only project, an English title without an English slug, an image-less project, legacy facts, a draft).

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

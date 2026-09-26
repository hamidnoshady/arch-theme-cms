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
| Runtime presentation settings | `GET /api/site` → `runtimeSettings` when present; defaults in `eshobe.theme.json` |
| Content bindings | `GET /api/site` → `bindings` when present; legacy slug fallbacks in `src/lib/theme/bindings.ts` |
| Blocks allowlist | `GET /api/site` → `blocks` |

### Content model

| Section | Source |
| --- | --- |
| Homepage | Binding `homePage` or page slug `home` (SEO); navigation from **header** nav |
| About, Services, Contact | Bindings or pages whose slug is `about` / `services` / `contact` |
| Projects, Education | Posts under category binding or slug `projects` / `education`; child categories are filters |
| Project facts | Structured CMS project metadata when available; else first `Label: Value` bullet list |
| Office map | Structured coordinates on contact blocks when available; else safe map URL parsing |
| Contact form | `formBlock` proxied via `/api/form-submissions` |

`fallbackLocale=false` on every content read.

## Runtime package

This theme depends on **`@eshobe/site-runtime`** (vendored under `vendor/site-runtime` until the package is published to npm). `eshobe.theme.json` `contractVersion` must match `contractVersion` from that package — enforced in `src/lib/manifest.test.ts` and `GET /api/health`.

Locale path helpers (`localeHref`, `dirFor`) live in `src/lib/locale.ts` (platform parity with eshobe-cms `src/lib/locales.ts`).

## Deploy

`eshobe.theme.json` is the Wave 11 manifest (`proxiesApi`, nixpacks, `/api/health`). `GET /api/health` is ready only when the CMS answers `GET /api/site` with a matching `contractVersion`.

`/api/*` except health and revalidate is proxied to the CMS without the site API key. Server-side reads attach the key and `Host`.

`POST /api/revalidate` verifies `x-eshobe-signature` on the **raw body**, then invalidates the `cms` cache tag, optional semantic `tags` / `resources`, and mapped paths.

## Fonts and the mark

- **Shazde** for Persian UI when licensed files exist under `public/fonts/`; **Inter** for English UI; Vazirmatn fallback.
- The Graphite vector mark remains the **theme demo fallback** when the CMS provides no logo.

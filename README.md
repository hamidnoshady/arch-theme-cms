# Graphite — Eshobe portfolio theme

A bilingual (Persian-default / English) Next.js theme for an architectural office. It includes the bounded single-screen entrance, reusable editorial/media system, Projects and Education archives/details, CMS-driven pages, map, and form proxy.

Built against **Eshobe Theme API contract v1** and deployable via Wave 11 (`eshobe.theme.json` → Coolify).

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

### Environment

Platform (Wave 11) injects the `ESHOBE_*` names. Legacy aliases still work for hand-rolled Coolify apps.

| Variable | Alias | Purpose |
|----------|-------|---------|
| `ESHOBE_CMS_URL` | `ESHOBE_API_URL` | Server-side CMS origin for REST and `/api/*` proxy |
| `ESHOBE_API_KEY` | `ESHOBE_SITE_API_KEY` | Site credential (runtime-only; never expose to the browser) |
| `ESHOBE_SITE_DOMAIN` | — | Customer hostname for `Host` / canonical URLs |
| `ESHOBE_PUBLIC_ORIGIN` | `NEXT_PUBLIC_SITE_URL` | Origin this deploy is reachable at (preview ≠ domain) |
| `ESHOBE_REVALIDATE_SECRET` | — | HMAC key for `POST /api/revalidate` |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | — | Optional override when media paths are relative |

The theme queries published Pages and Posts with `fallbackLocale=false`. Project and Education posts are selected by category slugs `projects` and `education`. Interior page slugs are `about`, `services`, and `contact`. The contact page can expose `formId`, contact fields, and verified `location`; the map renders only when location data exists.

## Deploy on Coolify (with eshobe-cms)

### Automated (recommended)

1. In CMS admin → **سرورهای استقرار**: add your Coolify target and self-test.
2. **پوسته‌های نصب‌شدنی**: register this repo, sync `eshobe.theme.json`, publish.
3. Provision an active **portfolio** site.
4. Deploy (preview first):

```http
POST /api/platform/sites/<SITE_ID>/deployment
Authorization: Bearer <platform_api_key>
Content-Type: application/json

{ "package": "graphite", "domainMode": "preview" }
```

5. When `live`, open the preview host `/api/health`. Use `domainMode: "edge"` or `"direct"` after the domain is verified (`direct` needs `proxiesApi`, which this theme declares).

### Manual Coolify

```bash
ESHOBE_CMS_URL=https://<cms-origin>
ESHOBE_API_KEY=eshobe_live_…
ESHOBE_SITE_DOMAIN=customer.example
ESHOBE_PUBLIC_ORIGIN=https://<coolify-preview-host>
```

Health: `GET /api/health`. Forms and other CMS APIs are proxied under `/api/*` (except `/api/health` and `/api/revalidate`).

## Content and assets

- Place the licensed **Shazde** webfont at `public/fonts/Shazde.woff2` (not committed).
- The included geometric SVG logo is a reconstruction and requires final brand approval / replacement with the authoritative vector.
- Empty states are intentional until verified CMS content is published — no office facts or projects are fabricated.

## Integration notes

- Manifest: root `eshobe.theme.json` (`build.healthCheckPath`, `proxiesApi`, platform env).
- Tenant resolution: `Host: ESHOBE_SITE_DOMAIN` and/or `Authorization: Bearer ESHOBE_API_KEY`.
- Revalidation: `POST /api/revalidate` verifies `x-eshobe-signature` = `sha256=HMAC(ESHOBE_REVALIDATE_SECRET, rawBody)`.
- Persian dates use the Shamsi calendar via `Intl` (`fa-IR-u-ca-persian`); English uses `en-GB`.

## Principal routes

| Persian | English |
|---------|---------|
| `/` | `/en` |
| `/about` | `/en/about` |
| `/projects` | `/en/projects` |
| `/services` | `/en/services` |
| `/education` | `/en/education` |
| `/contact` | `/en/contact` |
| `/projects/:slug` | `/en/projects/:slug` |

Health check: `GET /api/health`

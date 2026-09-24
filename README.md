# Graphite — Eshobe portfolio theme

A bilingual (Persian-default / English) Next.js theme for an architectural office. It includes the bounded single-screen entrance, reusable editorial/media system, Projects and Education archives/details, CMS-driven pages, map, and form proxy.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run build
```

### Environment

| Variable | Purpose |
|----------|---------|
| `ESHOBE_API_URL` | Server-side Eshobe origin for REST and form proxy |
| `ESHOBE_SITE_API_KEY` | Optional server-only site credential (never exposed to the browser) |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | Public media origin when paths are relative (should match `GET /api/site` → `media.origin`) |
| `NEXT_PUBLIC_SITE_URL` | Canonical customer domain for `sitemap.xml` and `robots.txt` |

The theme queries published Pages and Posts with `fallbackLocale=false`. Project and Education posts are selected by category slugs `projects` and `education`. Interior page slugs are `about`, `services`, and `contact`. The contact page can expose `formId`, contact fields, and verified `location`; the map renders only when location data exists.

## Content and assets

- Place the licensed **Shazde** webfont at `public/fonts/Shazde.woff2` (not committed).
- The included geometric SVG logo is a reconstruction and requires final brand approval / replacement with the authoritative vector.
- Empty states are intentional until verified CMS content is published — no office facts or projects are fabricated.

## Integration notes

- Follow `THEME_API.md` (Eshobe contract v1) for REST query syntax, tenant resolution via `Host` / site API key, and deployment manifest (`eshobe.theme.json`).
- `@eshobe/site-runtime` is referenced in platform docs; when published, prefer its `formatDate` / routing helpers over local duplicates.
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

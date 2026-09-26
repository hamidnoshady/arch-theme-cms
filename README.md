# Graphite — Architecture Office

A bilingual portfolio theme for the Eshobe CMS (Theme API contract v1). Persian is the default locale and is unprefixed; English lives under `/en`. The homepage is a single fixed screen: a constructed logo, then one bounded gesture that reveals five destinations. Interior pages share one editorial system.

## Develop

```bash
npm install
npm run dev
npm run typecheck
npm test
npm run lint
npm run build
```

Pages render on each request (`force-dynamic`). `ESHOBE_API_KEY` is read at runtime, never during the build, which is what the platform contract requires.

### Environment

| Variable | Purpose |
| --- | --- |
| `ESHOBE_CMS_URL` | CMS origin. Alias: `ESHOBE_API_URL`. |
| `ESHOBE_API_KEY` | Site credential. Runtime only. Alias: `ESHOBE_SITE_API_KEY`. |
| `ESHOBE_SITE_DOMAIN` | Customer hostname. Sent as `Host` so the CMS can resolve the tenant. |
| `ESHOBE_PUBLIC_ORIGIN` | Where this deployment is actually reachable. |
| `ESHOBE_REVALIDATE_SECRET` | HMAC key for `POST /api/revalidate`. |
| `NEXT_PUBLIC_MEDIA_ORIGIN` | Optional override for media URLs. |
| `MAP_TILE_URL` | Optional raster tile template (`{z}`, `{x}`, `{y}`). |

Without a CMS the site still renders: the homepage works, and interior sections explain that nothing has been published.

## Content model

The CMS has no dedicated Projects collection. Graphite uses the collections that exist.

| Section | Source |
| --- | --- |
| Homepage | Page with slug `home` (title and SEO only; the screen itself is the theme). |
| About, Services, Contact | A published page whose slug is `about`, `services` or `contact` in either locale. A Persian page may keep a Persian slug in `fa` as long as its `en` slug is the section key. |
| Projects, Education | Published posts filed under a category whose slug is `projects` or `education`. Child categories (via `parent`) become the project filters. |
| Project facts | The first bullet list of a project, one `Label: Value` per line (location, year, area, collaborators). Anything else stays in the body. There is no metadata field on posts. |
| Office map | Rendered only when published content links to OpenStreetMap, Google Maps, Neshan, Balad or a `geo:` URI that contains coordinates. An address without coordinates is shown as text and draws no map. |
| Contact form | A `formBlock` on the contact page. Submissions go to `/api/form-submissions`, which the theme proxies to the CMS. The CMS derives the tenant from the form. |
| Video | The media collection accepts images only. A video is a link to an `mp4`/`webm` file written on its own line in the text; the theme renders it in the shared player. Nothing plays until the visitor asks. |

`fallbackLocale=false` is set on every content read, so a missing translation is a missing page rather than a copy of the Persian one. The language switch says so and opens the nearest translated page.

## Fonts and the mark

- **Shazde** (licensed, not included). Place `Shazde-Variable.woff2`, or the static cuts `Shazde-Light.woff2`, `Shazde-Regular.woff2`, `Shazde-Medium.woff2`, `Shazde-SemiBold.woff2` and `Shazde-Bold.woff2`, in `public/fonts/`. Only files that exist are requested. Vazirmatn is the fallback.
- English text is Manrope. The GRAPHITE wordmark and the ARCHITECTURE OFFICE subtitle are Jost, independent of either text face.
- The geometric symbol is a reconstruction on a single isometric grid and needs approval against the original vector. Replace the path data in `src/components/brand/Logo.tsx`; every variant reads from it.

## Deploy

`eshobe.theme.json` is the Wave 11 manifest (`proxiesApi`, nixpacks, `/api/health`). Register the repo in the CMS, publish, and deploy a portfolio site. `GET /api/health` is ready only when the CMS answers `GET /api/site` for this tenant at contract version 1; `GET /api/health?live` only checks the process.

`/api/*` other than health and revalidate is proxied to the CMS with the customer `Host` preserved (node:http — `fetch` drops a custom Host). The site API key is not forwarded on that proxy, so a visitor cannot read drafts through it. Server-side reads send the key and the Host themselves.

`POST /api/revalidate` checks `x-eshobe-signature` over the raw body before clearing the cache.

## Where the theme differs from THEME_API.md

- `@eshobe/site-runtime` is not published. The helpers this theme needs are vendored in `src/lib/runtime` from eshobe-cms `929e6c1`, without the money module. Replace that folder with the package when it is published.
- Dates and numbers go through those helpers (Shamsi and Persian digits on `fa`, Tehran time).
- Video cannot be uploaded: `media.mimeTypes` is raster images only, on purpose. This theme does not widen that list.
- Posts have no structured project fields, so facts are read from the first bullet list instead of inventing a collection in the CMS.
- There is no coordinates field, so the map is parsed from a real map link or not shown.

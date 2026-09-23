# Graphite — Eshobe portfolio theme

A bilingual (Persian-default/English) Next.js theme for an architectural office. It includes the bounded single-screen entrance, reusable editorial/media system, Projects and Education archives/details, CMS-driven pages, map, and form proxy.

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Environment:
- `ESHOBE_API_URL`: server-side Eshobe origin
- `ESHOBE_SITE_API_KEY`: optional server-only site credential (never exposed)
- `NEXT_PUBLIC_MEDIA_ORIGIN`: public media origin when media paths are relative

The theme queries published Pages and Posts with `fallbackLocale=false`. Project and Education posts are selected by category slugs `projects` and `education`. Page slugs are `about`, `services`, and `contact`. The contact page can expose `formId`, contact data and verified `location`; no map is rendered without location data.

## Content and assets

Place the licensed Shazde webfont at `public/fonts/Shazde.woff2`; it is intentionally not committed. The included geometric SVG logo is a reconstruction and requires final brand approval/replacement with the authoritative vector. Empty states are intentional until verified CMS content is published—no office facts or projects are fabricated.

## Contract note

`THEME_API.md` and reference images were not present in the supplied repository (the checkout initially contained only this README). The manifest and REST adapter therefore use the prompt's documented contract assumptions and should be checked against the authoritative schema before platform registration.

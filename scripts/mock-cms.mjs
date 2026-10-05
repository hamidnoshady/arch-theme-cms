#!/usr/bin/env node
/**
 * QA-only mock of the Eshobe CMS REST surface the theme reads (Payload 3 semantics).
 * Never imported by the theme. Run: `node scripts/mock-cms.mjs --port 4010`.
 *
 * It reproduces the parts of Payload that decide what a visitor sees:
 *  - localized fields, with `fallbackLocale=false` returning null for an untranslated
 *    field and the default (`fa`) value otherwise;
 *  - `depth` population of relationships and uploads, inheriting locale + fallback;
 *  - `where[...]` filters (`equals`, `in`), `limit`, `sort=-publishedAt`;
 *  - drafts: a draft document is returned unless the caller filters `_status`.
 *
 * Content is deliberately uneven, like a real bilingual site: Services has no English
 * translation, one project is Persian-only, one has an English title but no English
 * slug, one has no image, one carries legacy bullet-list facts, and one is a draft.
 *
 * Modes (also switchable at runtime with `POST /__mock/mode {"mode": "..."}`):
 *   ok | down (every API call 503) | slow (`--delay` ms per call) | form-fail (submissions 500)
 *   sparse (no header, no pages, no posts — a freshly provisioned site)
 */
import http from 'node:http'

const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) pairs.push([arg.slice(2), all[i + 1]?.startsWith('--') ? 'true' : all[i + 1] ?? 'true'])
    return pairs
  }, []),
)
const PORT = Number(args.port ?? 4010)
let mode = String(args.mode ?? 'ok')
const DELAY = Number(args.delay ?? 2000)
const submissions = []

/* --------------------------------------------------------------- helpers */

const L = (fa, en) => ({ __l: true, fa: fa ?? null, en: en ?? null })
const uuid = (n) => `0a7f1c6e-2222-4a2b-8c3d-${String(n).padStart(12, '0')}`
const ID = {
  home: uuid(1), about: uuid(2), services: uuid(3), contact: uuid(4), press: uuid(5),
  projects: uuid(10), residential: uuid(11), publicCat: uuid(12), education: uuid(13),
  form: uuid(20),
}

const text = (t) => ({ type: 'text', text: t, format: 0, version: 1 })
const para = (t, dir) => ({ type: 'paragraph', children: t ? [text(t)] : [], direction: dir, version: 1 })
const heading = (t, tag, dir) => ({ type: 'heading', tag, children: t ? [text(t)] : [], direction: dir, version: 1 })
const root = (children, dir) => ({ root: { type: 'root', children, direction: dir, version: 1 } })
const upload = (media) => ({ type: 'upload', relationTo: 'media', value: media, version: 1 })
const bullets = (items, dir) => ({
  type: 'list', listType: 'bullet', tag: 'ul', direction: dir, version: 1,
  children: items.map((t) => ({ type: 'listitem', children: [text(t)], version: 1 })),
})

const PALETTE = ['#d9d4c7', '#c9cfd2', '#d6cbbf', '#cdd3c4', '#d3c9cf', '#c8c8c8']
const media = (n, name, w, h, alt) => ({
  id: uuid(100 + n),
  alt: L(alt[0], alt[1]),
  filename: `${name}.svg`,
  mimeType: 'image/svg+xml',
  url: `/api/media/file/${name}.svg`,
  width: w,
  height: h,
  sizes: {},
})
const MEDIA = {
  sea: media(1, 'sea-house', 1600, 1000, ['نمای خانهٔ ساحلی از سمت دریا', 'Sea House seen from the shore']),
  seaCourt: media(2, 'sea-house-court', 1600, 1067, ['حیاط میانی خانهٔ ساحلی', 'Sea House inner court']),
  seaStair: media(3, 'sea-house-stair', 1000, 1400, ['پلکان بتنی خانهٔ ساحلی', 'Sea House concrete stair']),
  seaNight: media(4, 'sea-house-night', 1600, 900, ['خانهٔ ساحلی در شب', 'Sea House at night']),
  library: media(5, 'brick-library', 1600, 1067, ['پوستهٔ آجری کتابخانه', 'Brick Library facade']),
  office: media(6, 'courtyard-office', 1200, 1500, ['حیاط دفتر', 'Courtyard Office court']),
  market: media(7, 'market-renewal', 1600, 1067, ['راستهٔ بازار', 'Market row']),
  sketch: media(8, 'sketching-basics', 1600, 1067, ['کارگاه طراحی دستی', 'Sketching workshop']),
}

/* ------------------------------------------------------------------ data */

const fa = 'rtl'
const en = 'ltr'

const pages = [
  {
    id: ID.home, _status: 'published', slug: L('home', 'home'),
    title: L('گرافیت', 'Graphite'),
    hero: { type: 'lowImpact', richText: L(root([heading('گرافیت', 'h1', fa)], fa), root([heading('Graphite', 'h1', en)], en)) },
    layout: [],
    meta: { title: L('گرافیت — دفتر معماری', 'Graphite — architecture office'), description: L('دفتر معماری', 'Architecture office') },
  },
  {
    // The demo pack writes the page title again as an h1 inside the hero rich text.
    id: ID.about, _status: 'published', slug: L('درباره-ما', 'about'),
    title: L('درباره ما', 'About'),
    hero: { type: 'lowImpact', richText: L(root([heading('درباره ما', 'h1', fa)], fa), root([heading('About', 'h1', en)], en)) },
    layout: [
      {
        id: 'about-content', blockType: 'content',
        columns: [{
          id: 'c1', size: 'full',
          richText: L(
            root([para('گرافیت دفتری کوچک در تهران است.', fa), para('', fa), heading('', 'h2', fa), para('باور داریم معماری خوب از شناخت دقیق زمین آغاز می‌شود.', fa)], fa),
            root([para('Graphite is a small Tehran studio.', en), para('', en), heading('', 'h2', en), para('We believe good architecture starts with a close reading of the site.', en)], en),
          ),
        }],
      },
    ],
    meta: { title: L('درباره ما', 'About'), description: L('دربارهٔ گرافیت', 'About Graphite') },
  },
  {
    // Persian only: English visitors must get a translated "not published" state, not a 404.
    id: ID.services, _status: 'published', slug: L('خدمات', null),
    title: L('خدمات', null),
    hero: { type: 'lowImpact', richText: L(root([heading('خدمات', 'h1', fa)], fa), null) },
    layout: [
      {
        id: 'svc', blockType: 'features', heading: L('آنچه انجام می‌دهیم', null),
        items: [
          { id: 's1', title: L('طراحی معماری', null), description: L('از طرح مفهومی تا نقشه‌های اجرایی.', null) },
          { id: 's2', title: L('نظارت بر اجرا', null), description: L('حضور منظم در کارگاه.', null) },
        ],
      },
    ],
    meta: {},
  },
  {
    id: ID.contact, _status: 'published', slug: L('تماس', 'contact'),
    title: L('تماس', 'Contact'),
    hero: { type: 'lowImpact', richText: L(root([heading('تماس', 'h1', fa), para('برای گفت‌وگو دربارهٔ پروژهٔ خود با ما تماس بگیرید.', fa)], fa), root([heading('Contact', 'h1', en), para('Get in touch to talk about your project.', en)], en)) },
    layout: [
      {
        id: 'contact-block', blockType: 'contact',
        heading: L('دفتر', 'Studio'),
        address: L('تهران، خیابان ولیعصر', 'Valiasr St, Tehran'),
        hours: L('شنبه تا چهارشنبه، ۹ تا ۱۷', 'Saturday to Wednesday, 9:00–17:00'),
        phones: ['+982188776655'],
        email: 'studio@graphite.test',
        latitude: 35.7448, longitude: 51.4105,
      },
      { id: 'contact-form', blockType: 'formBlock', form: ID.form, enableIntro: false },
    ],
    meta: {},
  },
  {
    id: ID.press, _status: 'published', slug: L('مطبوعات', null),
    title: L('مطبوعات', null), hero: { type: 'none' }, layout: [], meta: {},
  },
]

const categories = [
  { id: ID.projects, slug: L('projects', 'projects'), title: L('پروژه‌ها', 'Projects'), parent: null },
  { id: ID.residential, slug: L('residential', 'residential'), title: L('مسکونی', 'Residential'), parent: ID.projects },
  { id: ID.publicCat, slug: L('public', 'public'), title: L('عمومی', 'Public'), parent: ID.projects },
  { id: ID.education, slug: L('education', 'education'), title: L('آموزش', 'Education'), parent: null },
]

const longBody = (dir, t) =>
  root(
    [
      para(t.intro, dir),
      heading(t.h1, 'h2', dir),
      para(t.p1, dir),
      upload(MEDIA.sea), // the hero again: must not render twice
      upload(MEDIA.seaCourt),
      upload(MEDIA.seaStair),
      upload(MEDIA.seaNight),
      heading('', 'h2', dir), // empty heading node
      para('', dir), // empty paragraph node
      heading(t.h2, 'h2', dir),
      para(t.p2, dir),
      heading(t.h3, 'h2', dir),
      para(t.p3, dir),
    ],
    dir,
  )

let n = 0
const post = (o) => ({
  id: uuid(200 + ++n), _status: 'published', publishedAt: `2026-0${9 - n}-01T08:00:00.000Z`,
  categories: [ID.projects], relatedPosts: [], projectMetadata: null, heroImage: null, meta: {},
  ...o,
})
const posts = [
  post({
    slug: L('خانه-ساحلی', 'sea-house'), title: L('خانهٔ ساحلی', 'Sea House'),
    categories: [ID.projects, ID.residential], heroImage: MEDIA.sea,
    projectMetadata: { location: 'Nowshahr', date: '2023-05-01T00:00:00.000Z', area: '320 m²', status: null, client: null, additionalFacts: [{ id: 'f1', label: 'Structure', value: 'Exposed concrete' }] },
    content: L(
      longBody(fa, { intro: 'ویلایی رو به دریا با حیاط‌های میانی.', h1: 'زمین و اقلیم', p1: 'نسیم دریا و نور.', h2: 'مصالح', p2: 'بتن نمایان و چوب.', h3: 'اجرا', p3: 'ساخت در دو فصل.' }),
      longBody(en, { intro: 'A seaside villa with inner courts.', h1: 'Site and climate', p1: 'Sea breeze and daylight.', h2: 'Materials', p2: 'Exposed concrete and timber.', h3: 'Construction', p3: 'Built over two seasons.' }),
    ),
    meta: { description: L('ویلایی رو به دریا', 'A seaside villa') },
  }),
  post({
    // Persian only (no English title or slug).
    slug: L('کتابخانه-آجری', null), title: L('کتابخانهٔ آجری', null),
    categories: [ID.projects, ID.publicCat], heroImage: MEDIA.library,
    content: L(root([para('کتابخانهٔ محله با پوستهٔ آجری.', fa)], fa), null),
  }),
  post({
    // English title without an English slug: the old theme linked this to `/en/projects/undefined`.
    slug: L('دفتر-حیاط-دار', null), title: L('دفتر حیاط‌دار', 'Courtyard Office'),
    categories: [ID.projects, ID.publicCat], heroImage: MEDIA.office,
    content: L(root([para('ساختمان اداری با حیاط مرکزی.', fa)], fa), root([para('An office around a central court.', en)], en)),
  }),
  post({
    // No image at all: the card must not pretend an image is loading.
    slug: L('کلبه-دامنه', 'hillside-cabin'), title: L('کلبهٔ دامنه', 'Hillside Cabin'),
    categories: [ID.projects, ID.residential],
    projectMetadata: { location: 'Alamut', date: null, area: '96 m²' },
    content: L(root([para('کلبه‌ای کوچک روی شیب.', fa)], fa), root([para('A small cabin on a slope.', en)], en)),
  }),
  post({
    // Legacy facts: the first bullet list of the body, one `Label: Value` per item.
    slug: L('بازآفرینی-بازار', 'market-renewal'), title: L('بازآفرینی بازار', 'Market Renewal'),
    categories: [ID.projects, ID.publicCat], heroImage: MEDIA.market,
    content: L(
      root([bullets(['مکان: تبریز', 'سال: ۱۳۹۹'], fa), para('مرمت یک راستهٔ بازار.', fa)], fa),
      root([bullets(['Location: Tabriz', 'Year: 2020'], en), para('Restoration of a bazaar row.', en)], en),
    ),
  }),
  post({
    _status: 'draft', slug: L('پیش-نویس', 'secret-draft'), title: L('پیش‌نویس', 'Secret draft'),
    categories: [ID.projects], content: L(root([para('draft', fa)], fa), root([para('draft', en)], en)),
  }),
  post({
    slug: L('مبانی-طراحی-دستی', 'sketching-basics'), title: L('مبانی طراحی دستی', 'Sketching Basics'),
    categories: [ID.education], heroImage: MEDIA.sketch,
    content: L(root([para('کارگاه یک‌روزه.', fa)], fa), root([para('A one-day workshop.', en)], en)),
  }),
]
posts[0].relatedPosts = [posts[3].id, posts[1].id]

const header = {
  id: uuid(300),
  navItems: [
    { id: 'n1', link: { type: 'reference', reference: { relationTo: 'pages', value: ID.about }, label: L('درباره', 'About') } },
    { id: 'n2', link: { type: 'custom', url: L('/projects', '/projects'), label: L('پروژه‌ها', 'Projects') } },
    { id: 'n3', link: { type: 'reference', reference: { relationTo: 'pages', value: ID.services }, label: L('خدمات', 'Services') } },
    { id: 'n4', link: { type: 'custom', url: L('/education', '/education'), label: L('آموزش', 'Education') } },
    { id: 'n5', link: { type: 'reference', reference: { relationTo: 'pages', value: ID.contact }, label: L('تماس', 'Contact') } },
  ],
}
const footer = {
  id: uuid(301),
  navItems: [{ id: 'f1', link: { type: 'reference', reference: { relationTo: 'pages', value: ID.press }, label: L('مطبوعات', 'Press') } }],
}

const forms = [
  {
    id: ID.form,
    title: L('تماس', 'Contact'),
    submitButtonLabel: L('ارسال', 'Send'),
    confirmationType: 'message',
    confirmationMessage: L(root([para('سپاس؛ پیام شما رسید.', fa)], fa), root([para('Thank you — we will reply soon.', en)], en)),
    fields: [
      { id: 'ff1', blockType: 'text', name: 'name', label: L('نام', 'Name'), required: true, width: 50 },
      { id: 'ff2', blockType: 'email', name: 'email', label: L('رایانامه', 'Email'), required: true, width: 50 },
      { id: 'ff3', blockType: 'textarea', name: 'message', label: L('پیام', 'Message'), required: true, width: 100 },
    ],
  },
]

const site = {
  id: uuid(999),
  availableLocales: ['fa', 'en'],
  blocks: ['content', 'mediaBlock', 'cta', 'features', 'faq', 'contact', 'formBlock', 'gallery', 'team', 'archive'],
  contractVersion: 1,
  defaultLocale: 'fa',
  domain: 'arch.local',
  domainVerified: true,
  media: { origin: '' },
  name: 'Graphite',
  status: 'active',
  type: 'portfolio',
  branding: { displayName: 'Graphite', displayNameFa: 'گرافیت', shortName: 'Graphite' },
  themeRuntime: {
    theme: { key: 'graphite' },
    settings: { introAnimation: true, showSectionNumbers: true },
    bindings: {
      homePage: { id: ID.home, type: 'page', slug: 'home' },
      aboutPage: { id: ID.about, type: 'page', slug: 'about' },
      servicesPage: { id: ID.services, type: 'page', slug: 'services' },
      contactPage: { id: ID.contact, type: 'page', slug: 'contact' },
      projectsCategory: { id: ID.projects, type: 'category', slug: 'projects' },
      educationCategory: { id: ID.education, type: 'category', slug: 'education' },
    },
  },
}

const COLLECTIONS = { pages, posts, categories, header: [header], footer: [footer], forms }
const RELATIONS = {
  posts: { heroImage: 'media', categories: 'categories', relatedPosts: 'posts' },
  categories: { parent: 'categories' },
}

/* -------------------------------------------------------------- semantics */

function localize(value, locale, fallback) {
  if (Array.isArray(value)) return value.map((v) => localize(v, locale, fallback))
  if (!value || typeof value !== 'object') return value
  if (value.__l) return localize(value[locale] ?? (fallback ? value.fa : null), locale, fallback)
  return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, localize(v, locale, fallback)]))
}

const byId = (collection, id) =>
  collection === 'media' ? Object.values(MEDIA).find((m) => m.id === id) : COLLECTIONS[collection]?.find((d) => d.id === id)

function populate(collection, doc, depth, locale, fallback) {
  if (!doc || depth < 1) return doc
  const out = { ...doc }
  for (const [field, target] of Object.entries(RELATIONS[collection] ?? {})) {
    const fill = (v) => {
      const id = typeof v === 'string' ? v : v?.id
      const found = id ? byId(target, id) : null
      return found ? populate(target, localize(found, locale, fallback), depth - 1, locale, fallback) : v
    }
    if (Array.isArray(out[field])) out[field] = out[field].map(fill)
    else if (out[field]) out[field] = fill(out[field])
  }
  if (collection === 'header' || collection === 'footer') {
    out.navItems = (out.navItems ?? []).map((item) => {
      const ref = item.link?.reference
      if (!ref) return item
      const found = byId(ref.relationTo, ref.value)
      const value = found ? localize(found, locale, fallback) : ref.value
      return { ...item, link: { ...item.link, reference: { ...ref, value } } }
    })
  }
  return out
}

function matches(doc, where) {
  for (const [path, ops] of Object.entries(where)) {
    const value = doc[path]
    for (const [op, raw] of Object.entries(ops)) {
      const ids = (v) => (Array.isArray(v) ? v.map((x) => (typeof x === 'string' ? x : x?.id)) : [typeof v === 'string' ? v : v?.id ?? v])
      if (op === 'equals' && !ids(value).includes(raw)) return false
      if (op === 'in' && !String(raw).split(',').some((r) => ids(value).includes(r))) return false
    }
  }
  return true
}

function parseWhere(params) {
  const where = {}
  for (const [key, value] of params) {
    const m = key.match(/^where\[([^\]]+)\]\[([^\]]+)\]$/)
    if (!m) continue
    if (m[1] === 'site') continue // single-tenant mock
    ;(where[m[1]] ??= {})[m[2]] = value
  }
  return where
}

function svg(name) {
  const m = Object.values(MEDIA).find((x) => x.filename === `${name}`)
  const w = m?.width ?? 1600
  const h = m?.height ?? 1000
  const fill = PALETTE[(name.length * 7) % PALETTE.length]
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${fill}"/><g fill="none" stroke="#111" stroke-width="3"><rect x="${w * 0.15}" y="${h * 0.35}" width="${w * 0.3}" height="${h * 0.45}"/><rect x="${w * 0.48}" y="${h * 0.22}" width="${w * 0.36}" height="${h * 0.58}"/><line x1="${w * 0.05}" y1="${h * 0.8}" x2="${w * 0.95}" y2="${h * 0.8}"/></g></svg>`
}

/* ---------------------------------------------------------------- server */

const send = (res, status, body, type = 'application/json') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store' })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://mock')
  const chunks = []
  for await (const c of req) chunks.push(c)
  const body = Buffer.concat(chunks).toString('utf8')

  if (url.pathname === '/__mock/mode' && req.method === 'POST') {
    mode = JSON.parse(body || '{}').mode ?? 'ok'
    return send(res, 200, { mode })
  }
  if (url.pathname === '/__mock/submissions') return send(res, 200, submissions)

  if (mode === 'slow') await new Promise((r) => setTimeout(r, DELAY))
  if (mode === 'down' && url.pathname.startsWith('/api/')) return send(res, 503, { errors: [{ message: 'unavailable' }] })

  const file = url.pathname.match(/^\/api\/media\/file\/([^/]+)$/)
  if (file) {
    if (file[1].startsWith('missing')) return send(res, 404, 'not found', 'text/plain')
    return send(res, 200, svg(decodeURIComponent(file[1])), 'image/svg+xml')
  }

  if (url.pathname === '/api/site') return send(res, 200, site)
  if (url.pathname === '/api/users/me') return send(res, 200, { user: null })

  if (url.pathname === '/api/form-submissions' && req.method === 'POST') {
    if (mode === 'form-fail') return send(res, 500, { errors: [{ message: 'mail transport down' }] })
    let data
    try {
      data = JSON.parse(body)
    } catch {
      return send(res, 400, { errors: [{ message: 'invalid JSON' }] })
    }
    if (!forms.some((f) => f.id === data.form)) return send(res, 400, { errors: [{ message: 'unknown form' }] })
    submissions.push(data)
    return send(res, 201, { doc: { id: uuid(5000 + submissions.length) } })
  }

  const m = url.pathname.match(/^\/api\/(pages|posts|categories|header|footer|forms)(?:\/([^/]+))?$/)
  if (!m || req.method !== 'GET') return send(res, 404, { errors: [{ message: 'Not Found' }] })
  const [, collection, id] = m
  const locale = url.searchParams.get('locale') === 'en' ? 'en' : 'fa'
  const fallback = url.searchParams.get('fallbackLocale') !== 'false'
  const depth = Number(url.searchParams.get('depth') ?? 2)
  const sparse = mode === 'sparse' && collection !== 'forms' && collection !== 'categories'
  const source = sparse ? [] : COLLECTIONS[collection]

  if (id) {
    const doc = source.find((d) => d.id === decodeURIComponent(id))
    if (!doc) return send(res, 404, { errors: [{ message: 'Not Found' }] })
    return send(res, 200, populate(collection, localize(doc, locale, fallback), depth, locale, fallback))
  }

  const where = parseWhere(url.searchParams)
  let docs = source.map((d) => localize(d, locale, fallback)).filter((d) => matches(d, where))
  if (url.searchParams.get('sort') === '-publishedAt') docs.sort((a, b) => String(b.publishedAt).localeCompare(String(a.publishedAt)))
  const limit = Number(url.searchParams.get('limit') ?? 10)
  docs = docs.slice(0, limit).map((d) => populate(collection, d, depth, locale, fallback))
  return send(res, 200, { docs, totalDocs: docs.length, hasNextPage: false })
})

server.listen(PORT, '127.0.0.1', () => console.log(`mock CMS on http://127.0.0.1:${PORT} (mode: ${mode})`))

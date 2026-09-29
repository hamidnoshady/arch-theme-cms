import { cache } from 'react'

import { HOME_SLUG } from '@eshobe/site-runtime'
import { ENTRY_KINDS, sectionRef } from './theme/sections'
import { siteId } from './env'
import { cmsJson } from './upstream'
import type {
  Category,
  EntryKind,
  Form,
  Locale,
  NavCollection,
  Page,
  Paginated,
  Post,
  Section,
  SiteDescriptor,
} from './types'

const TTL_OK = 60_000
const TTL_MISS = 5_000

type Slot = { at: number; ttl: number; result: CmsResult<unknown> }
const slots = new Map<string, Slot>()
const inflight = new Map<string, Promise<CmsResult<unknown>>>()

/** Drops the in-process response cache. Called after a verified revalidation webhook. */
export function invalidateCmsCache() {
  slots.clear()
}

type Query = Record<string, string | number | boolean | undefined>

function toSearch(query: Query): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value))
  }
  const s = params.toString()
  return s ? `?${s}` : ''
}

export type CmsResult<T> = { ok: true; data: T } | { ok: false; status: number }

/** An answer that says nothing about the content: the CMS was down, slow or erroring. */
const transient = (status: number) => status === 0 || status === 429 || status >= 500

async function fetchSlot<T>(key: string, path: string, search: string, previous?: Slot): Promise<CmsResult<T>> {
  const { status, data } = await cmsJson<T>(path, search)
  const result: CmsResult<T> = data !== null ? { ok: true, data } : { ok: false, status }
  // A CMS hiccup must not blank a page that rendered a minute ago: keep serving the last
  // good answer and retry soon, instead of caching the failure.
  if (!result.ok && transient(status) && previous?.result.ok) {
    slots.set(key, { at: Date.now(), ttl: TTL_MISS, result: previous.result })
    return previous.result as CmsResult<T>
  }
  slots.set(key, { at: Date.now(), ttl: result.ok ? TTL_OK : TTL_MISS, result })
  return result
}

/**
 * Server-only REST call. Tenant is resolved by the CMS from the site API key (or `Host`
 * without one) in `cmsRequestHeaders` — never from a query parameter. Concurrent renders
 * asking the same question share one request.
 */
export async function cmsGet<T>(path: string, query: Query = {}): Promise<CmsResult<T>> {
  const search = toSearch(query)
  const key = `${path}${search}`
  const hit = slots.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.result as CmsResult<T>

  const pending = inflight.get(key)
  if (pending) return pending as Promise<CmsResult<T>>
  const request = fetchSlot<T>(key, path, search, hit).finally(() => inflight.delete(key))
  inflight.set(key, request)
  return request
}

/**
 * Narrows a list to this deployment's site. A `where` can only narrow a CMS read, never
 * widen it, so this is free when the CMS already scopes the request — and it is what
 * keeps a header, footer or category list from another tenant out of this site on a CMS
 * that scopes some collections by `Host` only.
 */
function withSite(query: Query): Query {
  const id = siteId()
  return id ? { ...query, 'where[site][equals]': id } : query
}

/** A site API key also reads drafts; a public render shows published documents only. */
const isPublished = (doc: object | null | undefined) => {
  const status = (doc as { _status?: string | null } | null | undefined)?._status
  return Boolean(doc) && (status === undefined || status === null || status === 'published')
}

async function list<T>(collection: string, query: Query): Promise<T[]> {
  const res = await cmsGet<Paginated<T>>(collection, withSite(query))
  return res.ok ? res.data.docs ?? [] : []
}

/* ------------------------------------------------------------------ site */

export const getSite = cache(async (): Promise<SiteDescriptor | null> => {
  const res = await cmsGet<SiteDescriptor>('site')
  return res.ok ? res.data : null
})

/** Locales this deployment may serve. Without a CMS (local dev) both are served. */
export async function servedLocales(): Promise<Locale[]> {
  const site = await getSite()
  if (!site?.availableLocales?.length) return ['fa', 'en']
  return (['fa', 'en'] as Locale[]).filter((l) => site.availableLocales.includes(l))
}

/* ----------------------------------------------------------------- pages */

const hasLocalizedContent = (doc: { slug?: string | null; title?: string | null } | null) =>
  Boolean(doc?.slug && doc?.title)

export const getPageBySlug = cache(async (slug: string, locale: Locale): Promise<Page | null> => {
  const docs = await list<Page>('pages', {
    locale,
    depth: 2,
    limit: 1,
    fallbackLocale: false,
    'where[slug][equals]': slug,
    'where[_status][equals]': 'published',
  })
  return hasLocalizedContent(docs[0] ?? null) ? docs[0]! : null
})

export const getPageById = cache(async (id: string, locale: Locale): Promise<Page | null> => {
  const res = await cmsGet<Page>(`pages/${encodeURIComponent(id)}`, {
    locale,
    depth: 2,
    fallbackLocale: false,
  })
  return res.ok && isPublished(res.data) && hasLocalizedContent(res.data) ? res.data : null
})

/**
 * The page behind a section route (`/about`, `/services`, `/contact`). The document the site
 * owner bound to the matching content slot wins, whatever its slug; a bound page that has no
 * translation in `locale` is reported as missing rather than swapped for an unrelated page.
 * With nothing bound, the page whose slug is the section key (in either locale, so a Persian
 * page may keep a Persian slug as long as its English slug is the key) is used.
 */
export const getSectionPage = cache(async (section: Section, locale: Locale) => {
  const { id, slug } = sectionRef(await getSite(), section)
  if (id) return getPageById(id, locale)

  const key = slug ?? section
  const direct = await getPageBySlug(key, locale)
  if (direct) return direct
  for (const other of ['en', 'fa'] as Locale[]) {
    if (other === locale) continue
    const docs = await list<Page>('pages', {
      locale: other,
      depth: 0,
      limit: 1,
      fallbackLocale: false,
      'select[slug]': true,
      'where[slug][equals]': key,
      'where[_status][equals]': 'published',
    })
    if (docs[0]?.id) return getPageById(docs[0].id, locale)
  }
  return null
})

/** Whether a section page has content in `locale` — used for alternates. */
export async function sectionPageExists(section: Section, locale: Locale) {
  return Boolean(await getSectionPage(section, locale))
}

/** The home page: the bound document when there is one, else the page with the reserved `home` slug. */
export const getHomePage = cache(async (locale: Locale): Promise<Page | null> => {
  const { id, slug } = sectionRef(await getSite(), 'home')
  if (id) return getPageById(id, locale)
  return getPageBySlug(slug ?? HOME_SLUG, locale)
})

/** Slug of a document in another locale, or null when it is not translated. */
export const getTranslatedSlug = cache(
  async (collection: 'pages' | 'posts', id: string, locale: Locale): Promise<string | null> => {
    const res = await cmsGet<{ slug?: string | null; title?: string | null; _status?: string | null }>(
      `${collection}/${encodeURIComponent(id)}`,
      {
        locale,
        depth: 0,
        fallbackLocale: false,
        'select[slug]': true,
        'select[title]': true,
        'select[_status]': true,
      },
    )
    return res.ok && isPublished(res.data) && hasLocalizedContent(res.data) ? res.data.slug! : null
  },
)

export async function listPublishedPages(locale: Locale): Promise<Page[]> {
  return list<Page>('pages', {
    locale,
    depth: 0,
    limit: 500,
    fallbackLocale: false,
    sort: '-updatedAt',
    'select[slug]': true,
    'select[title]': true,
    'select[updatedAt]': true,
    'where[_status][equals]': 'published',
  })
}

/* ------------------------------------------------------------ categories */

export const getCategories = cache(async (locale: Locale): Promise<Category[]> =>
  list<Category>('categories', { locale, depth: 0, limit: 300, fallbackLocale: false }),
)

export type SectionCategories = {
  root: Category | null
  /** The root plus every descendant, as ids. */
  ids: string[]
  /** Direct and nested children, titled in the requested locale. */
  children: Category[]
}

const parentId = (c: Category) => (typeof c.parent === 'string' ? c.parent : c.parent?.id ?? null)

/**
 * Projects and Education are Posts filed under a root category. The root is the category the
 * site owner bound to the section's content slot; with nothing bound (or a binding that no
 * longer exists) it is the category whose slug is `projects` / `education` in either locale.
 * Sub-categories (by `parent`) become the filter.
 */
export const getSectionCategories = cache(
  async (kind: EntryKind, locale: Locale): Promise<SectionCategories> => {
    const [fa, en, site] = await Promise.all([getCategories('fa'), getCategories('en'), getSite()])
    const { id: boundId, slug: hint } = sectionRef(site, kind)
    const every = [...en, ...fa]
    const bySlug = (slug: string | null) => (slug ? every.find((c) => c.slug === slug)?.id : undefined)
    const rootId =
      (boundId && every.some((c) => c.id === boundId) ? boundId : undefined) ?? bySlug(hint) ?? bySlug(kind)
    if (!rootId) return { root: null, ids: [], children: [] }

    const all = locale === 'fa' ? fa : en
    const byId = new Map(all.map((c) => [c.id, c]))
    const known = new Map([...fa, ...en].map((c) => [c.id, c]))
    const ids = new Set([rootId])
    let grew = true
    while (grew) {
      grew = false
      for (const c of known.values()) {
        const p = parentId(c)
        if (p && ids.has(p) && !ids.has(c.id)) {
          ids.add(c.id)
          grew = true
        }
      }
    }
    const children = [...ids]
      .filter((id) => id !== rootId)
      .map((id) => byId.get(id))
      .filter((c): c is Category => Boolean(c?.title))
    return { root: byId.get(rootId) ?? known.get(rootId) ?? null, ids: [...ids], children }
  },
)

/* ----------------------------------------------------------------- posts */

const isTranslated = (p: Post) => Boolean(p.slug && p.title)

export const getEntries = cache(async (kind: EntryKind, locale: Locale): Promise<Post[]> => {
  const { ids } = await getSectionCategories(kind, locale)
  if (!ids.length) return []
  const docs = await list<Post>('posts', {
    locale,
    depth: 1,
    limit: 100,
    fallbackLocale: false,
    sort: '-publishedAt',
    'where[categories][in]': ids.join(','),
    'where[_status][equals]': 'published',
  })
  return docs.filter(isTranslated)
})

export const getPostBySlug = cache(async (slug: string, locale: Locale): Promise<Post | null> => {
  const docs = await list<Post>('posts', {
    locale,
    depth: 2,
    limit: 1,
    fallbackLocale: false,
    'where[slug][equals]': slug,
    'where[_status][equals]': 'published',
  })
  return docs[0] && isTranslated(docs[0]) ? docs[0] : null
})

export const getPostsByIds = cache(async (ids: string, locale: Locale): Promise<Post[]> => {
  if (!ids) return []
  const docs = await list<Post>('posts', {
    locale,
    depth: 1,
    limit: 50,
    fallbackLocale: false,
    'where[id][in]': ids,
    'where[_status][equals]': 'published',
  })
  return docs.filter(isTranslated)
})

export async function getPostsForCategories(
  categoryIds: string[],
  locale: Locale,
  limit: number,
): Promise<Post[]> {
  const docs = await list<Post>('posts', {
    locale,
    depth: 1,
    limit: Math.min(Math.max(limit, 1), 50),
    fallbackLocale: false,
    sort: '-publishedAt',
    ...(categoryIds.length ? { 'where[categories][in]': categoryIds.join(',') } : {}),
    'where[_status][equals]': 'published',
  })
  return docs.filter(isTranslated)
}

const categoryIds = (post: Post) =>
  (post.categories ?? [])
    .map((c) => (typeof c === 'string' ? c : c?.id))
    .filter((id): id is string => Boolean(id))

/** Which theme section a post belongs to, from its categories. */
export async function sectionOfPost(post: Post, locale: Locale): Promise<EntryKind | null> {
  const ids = categoryIds(post)
  for (const kind of ENTRY_KINDS) {
    const section = await getSectionCategories(kind, locale)
    if (ids.some((id) => section.ids.includes(id))) return kind
  }
  return null
}

/* ----------------------------------------------------------- nav & forms */

export const getNav = cache(
  async (collection: 'header' | 'footer', locale: Locale): Promise<NavCollection | null> => {
    const docs = await list<NavCollection>(collection, { locale, depth: 1, limit: 1 })
    return docs[0] ?? null
  },
)

export const getForm = cache(async (id: string, locale: Locale): Promise<Form | null> => {
  const res = await cmsGet<Form>(`forms/${encodeURIComponent(id)}`, { locale, depth: 0 })
  return res.ok ? res.data : null
})

import { cache } from 'react'

import { HOME_SLUG } from './runtime'
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

export const CMS_TAG = 'cms'
const TTL_OK = 60_000
const TTL_MISS = 5_000

type Slot = { at: number; ttl: number; result: CmsResult<unknown> }
const slots = new Map<string, Slot>()

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

/**
 * Server-only REST call. Tenant is resolved by the CMS from `Host` and/or the
 * site API key in `cmsRequestHeaders` — never from a query parameter.
 */
export async function cmsGet<T>(path: string, query: Query = {}): Promise<CmsResult<T>> {
  const key = `${path}${toSearch(query)}`
  const hit = slots.get(key)
  if (hit && Date.now() - hit.at < hit.ttl) return hit.result as CmsResult<T>

  const { status, data } = await cmsJson<T>(path, toSearch(query))
  const result: CmsResult<T> = data !== null ? { ok: true, data } : { ok: false, status }
  slots.set(key, { at: Date.now(), ttl: result.ok ? TTL_OK : TTL_MISS, result })
  return result
}

async function list<T>(collection: string, query: Query): Promise<T[]> {
  const res = await cmsGet<Paginated<T>>(collection, query)
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

export async function isLocaleServed(locale: Locale): Promise<boolean> {
  return (await servedLocales()).includes(locale)
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
  return res.ok && hasLocalizedContent(res.data) ? res.data : null
})

/**
 * A section page is identified by its section key (`about`, `services`, …) as
 * the page slug in either locale, so a Persian page may keep a Persian slug as
 * long as its English slug is the key. Returns the page in `locale`, or null
 * when that translation does not exist.
 */
export const getSectionPage = cache(async (section: Section, locale: Locale) => {
  const direct = await getPageBySlug(section, locale)
  if (direct) return direct
  for (const other of ['en', 'fa'] as Locale[]) {
    if (other === locale) continue
    const docs = await list<Page>('pages', {
      locale: other,
      depth: 0,
      limit: 1,
      fallbackLocale: false,
      'select[slug]': true,
      'where[slug][equals]': section,
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

export const getHomePage = cache((locale: Locale) => getPageBySlug(HOME_SLUG, locale))

/** Slug of a document in another locale, or null when it is not translated. */
export const getTranslatedSlug = cache(
  async (collection: 'pages' | 'posts', id: string, locale: Locale): Promise<string | null> => {
    const res = await cmsGet<{ slug?: string | null; title?: string | null }>(
      `${collection}/${encodeURIComponent(id)}`,
      { locale, depth: 0, fallbackLocale: false, 'select[slug]': true, 'select[title]': true },
    )
    return res.ok && hasLocalizedContent(res.data) ? res.data.slug! : null
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
 * Projects and Education are Posts filed under a root category whose slug is
 * `projects` / `education` in either locale. Sub-categories (by `parent`) become
 * the Projects filter.
 */
export const getSectionCategories = cache(
  async (kind: EntryKind, locale: Locale): Promise<SectionCategories> => {
    const [fa, en] = await Promise.all([getCategories('fa'), getCategories('en')])
    const rootId = [...en, ...fa].find((c) => c.slug === kind)?.id
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
  for (const kind of ['projects', 'education'] as EntryKind[]) {
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

import type { Metadata } from 'next'
import { notFound, permanentRedirect, redirect } from 'next/navigation'

import { EntryView, IndexView } from '@/views/EntryViews'
import { GenericPageView, SectionPageView } from '@/views/PageView'

import { getPageBySlug, getPostBySlug, getSectionPage, getTranslatedSlug, sectionOfPost } from './cms'
import { getRenderContext, type RenderContext } from './context'
import { SECTIONS, copy, href, otherLocale } from './i18n'
import { pageHref } from './links'
import { ogImageUrl } from './media'
import { HOME_SLUG, POSTS_SEGMENT } from '@eshobe/site-runtime'
import { buildMetadata } from './seo'
import type { EntryKind, Locale, LocaleLink, Page, Post, Section } from './types'

const ENTRY_KINDS: EntryKind[] = ['projects', 'education']
const PAGE_SECTIONS = ['about', 'services', 'contact'] as const
type PageSection = (typeof PAGE_SECTIONS)[number]

const isEntryKind = (s: string): s is EntryKind => (ENTRY_KINDS as string[]).includes(s)
const isPageSection = (s: string): s is PageSection => (PAGE_SECTIONS as readonly string[]).includes(s)

function decode(segment: string) {
  try {
    return decodeURIComponent(segment).normalize('NFC')
  } catch {
    return segment
  }
}

export type Resolved =
  | { kind: 'section'; section: PageSection; page: Page | null; language: LocaleLink | null }
  | { kind: 'index'; section: EntryKind; intro: Page | null; language: LocaleLink | null }
  | { kind: 'entry'; section: EntryKind; post: Post; language: LocaleLink | null }
  | { kind: 'page'; page: Page; language: LocaleLink | null }
  | { kind: 'redirect'; to: string; permanent: boolean }
  | { kind: 'missing' }

async function entryLanguage(post: Post, kind: EntryKind, ctx: RenderContext): Promise<LocaleLink | null> {
  if (!ctx.otherServed) return null
  const other = otherLocale(ctx.locale)
  const slug = await getTranslatedSlug('posts', post.id, other)
  return slug
    ? { href: href(other, `${kind}/${encodeURIComponent(slug)}`), available: true }
    : { href: href(other, kind), available: false }
}

export async function resolve(locale: Locale, rawSegments: string[]): Promise<Resolved> {
  const ctx = await getRenderContext(locale)
  if (!ctx.served.includes(locale)) return { kind: 'missing' }
  const segments = rawSegments.map(decode).filter(Boolean)
  const [first, second, ...rest] = segments
  const other = otherLocale(locale)
  if (!first || rest.length) return { kind: 'missing' }

  if (isPageSection(first) && !second) {
    const [page, otherPage] = await Promise.all([getSectionPage(first, locale), ctx.otherServed ? getSectionPage(first, other) : null])
    const language = ctx.otherServed ? { href: href(other, first), available: Boolean(otherPage) || !page } : null
    return { kind: 'section', section: first, page, language }
  }

  if (isEntryKind(first)) {
    if (!second) {
      const intro = await getSectionPage(first, locale)
      return { kind: 'index', section: first, intro, language: ctx.otherServed ? { href: href(other, first), available: true } : null }
    }
    const post = await getPostBySlug(second, locale)
    if (!post) return { kind: 'missing' }
    const actual = await sectionOfPost(post, locale)
    if (!actual) return { kind: 'missing' }
    if (actual !== first) return { kind: 'redirect', to: href(locale, `${actual}/${encodeURIComponent(second)}`), permanent: true }
    return { kind: 'entry', section: first, post, language: await entryLanguage(post, first, ctx) }
  }

  if (first === POSTS_SEGMENT) {
    if (!second) return { kind: 'redirect', to: href(locale, 'education'), permanent: false }
    const post = await getPostBySlug(second, locale)
    const kind = post ? await sectionOfPost(post, locale) : null
    return kind ? { kind: 'redirect', to: href(locale, `${kind}/${encodeURIComponent(second)}`), permanent: false } : { kind: 'missing' }
  }

  if (second) return { kind: 'missing' }
  if (first === HOME_SLUG) return { kind: 'redirect', to: href(locale), permanent: true }

  const page = await getPageBySlug(first, locale)
  if (!page) return { kind: 'missing' }
  // A section page reached through its localized slug has one canonical URL.
  const enSlug = locale === 'en' ? page.slug : await getTranslatedSlug('pages', page.id, 'en')
  if (enSlug && (SECTIONS as string[]).includes(enSlug)) return { kind: 'redirect', to: href(locale, enSlug), permanent: true }

  let language: LocaleLink | null = null
  if (ctx.otherServed) {
    const slug = await getTranslatedSlug('pages', page.id, other)
    language = slug ? { href: pageHref(slug, other), available: true } : { href: href(other), available: false }
  }
  return { kind: 'page', page, language }
}

export async function routeMetadata(locale: Locale, segments: string[]): Promise<Metadata> {
  const r = await resolve(locale, segments)
  const ctx = await getRenderContext(locale)
  const t = copy[locale]
  const other = otherLocale(locale)
  const alt = (language: LocaleLink | null) => (language?.available ? { [other]: language.href } : {})

  switch (r.kind) {
    case 'section':
    case 'index': {
      const page = r.kind === 'section' ? r.page : r.intro
      return buildMetadata({
        locale,
        title: page?.meta?.title || page?.title || t[r.section],
        description: page?.meta?.description,
        path: href(locale, r.section),
        alternates: alt(r.language),
        image: ogImageUrl(page?.meta?.image, ctx.origin) ?? ogImageUrl(ctx.branding.defaultOgImage, ctx.origin),
        siteName: ctx.branding.siteName,
      })
    }
    case 'entry':
      return buildMetadata({
        locale,
        title: r.post.meta?.title || r.post.title,
        description: r.post.meta?.description,
        path: href(locale, `${r.section}/${encodeURIComponent(r.post.slug ?? '')}`),
        alternates: alt(r.language),
        image: ogImageUrl(r.post.meta?.image, ctx.origin) ?? ogImageUrl(r.post.heroImage, ctx.origin),
        type: 'article',
        publishedTime: r.post.publishedAt,
        siteName: ctx.branding.siteName,
      })
    case 'page':
      return buildMetadata({
        locale,
        title: r.page.meta?.title || r.page.title,
        description: r.page.meta?.description,
        path: pageHref(r.page.slug, locale),
        alternates: alt(r.language),
        image: ogImageUrl(r.page.meta?.image, ctx.origin) ?? ogImageUrl(ctx.branding.defaultOgImage, ctx.origin),
        siteName: ctx.branding.siteName,
      })
    default:
      return { title: t.notFoundTitle, robots: { index: false, follow: false } }
  }
}

export async function renderRoute(locale: Locale, segments: string[], query: { category?: string | string[] } = {}) {
  const r = await resolve(locale, segments)
  const ctx = await getRenderContext(locale)
  switch (r.kind) {
    case 'redirect':
      return r.permanent ? permanentRedirect(r.to) : redirect(r.to)
    case 'section':
      return <SectionPageView section={r.section} page={r.page} ctx={ctx} language={r.language} />
    case 'index': {
      const category = Array.isArray(query.category) ? query.category[0] : query.category
      return <IndexView kind={r.section} ctx={ctx} language={r.language} intro={r.intro} category={category} />
    }
    case 'entry':
      return <EntryView kind={r.section} post={r.post} ctx={ctx} language={r.language} />
    case 'page':
      return <GenericPageView page={r.page} ctx={ctx} language={r.language} />
    default:
      notFound()
  }
}

export type { Section }

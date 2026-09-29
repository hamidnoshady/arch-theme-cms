import Link from 'next/link'

import { RichText } from '@/components/content/RichText'
import { projectFactsAndBody } from '@/lib/project-metadata'
import { EmptyState, MetaList, PageTitle, type MetaItem } from '@/components/editorial/Editorial'
import { EntryGrid, toCardEntry } from '@/components/entries/EntryCard'
import { Filters } from '@/components/entries/Filters'
import { RelatedEntries } from '@/components/entries/RelatedEntries'
import { PageShell, sectionActive } from '@/components/layout/PageShell'
import { MediaFrame } from '@/components/media/MediaFrame'
import { getEntries, getSectionCategories, type SectionCategories } from '@/lib/cms'
import type { RenderContext } from '@/lib/context'
import { copy, formatDate, href, sectionNumber } from '@/lib/i18n'
import { resolveMedia } from '@/lib/media'
import type { EntryKind, LocaleLink, Page, Post } from '@/lib/types'

/** Copy that differs per section: empty state and the "more like this" headings. */
const entryCopy = (t: (typeof copy)['fa'], kind: EntryKind) =>
  kind === 'projects'
    ? { empty: t.emptyProjects, related: t.relatedProjects, next: t.nextProjects }
    : kind === 'blog'
      ? { empty: t.emptyBlog, related: t.relatedBlog, next: t.nextBlog }
      : { empty: t.emptyEducation, related: t.relatedEducation, next: t.nextEducation }

/** Sections whose entries are dated articles rather than project fact sheets. */
const isArticle = (kind: EntryKind) => kind !== 'projects'

const categoryIds = (post: Post) =>
  (post.categories ?? []).map((c) => (typeof c === 'string' ? c : c?.id)).filter((id): id is string => Boolean(id))

/** The most specific category below the section root, titled in this locale. */
function subCategory(post: Post, section: SectionCategories) {
  const ids = categoryIds(post)
  return section.children.find((c) => ids.includes(c.id)) ?? null
}

export async function IndexView({
  kind,
  ctx,
  language,
  intro,
  category,
}: {
  kind: EntryKind
  ctx: RenderContext
  language: LocaleLink | null
  intro: Page | null
  category?: string
}) {
  const t = copy[ctx.locale]
  const [entries, section] = await Promise.all([getEntries(kind, ctx.locale), getSectionCategories(kind, ctx.locale)])

  const options =
    kind !== 'education'
      ? section.children
          .map((c) => ({
            key: c.slug || c.id,
            label: c.title ?? '',
            count: entries.filter((e) => categoryIds(e).includes(c.id)).length,
          }))
          .filter((o) => o.count > 0)
      : []
  const activeCategory = options.find((o) => o.key === category)
  const activeId = activeCategory ? section.children.find((c) => (c.slug || c.id) === activeCategory.key)?.id : undefined
  const visible = activeId ? entries.filter((e) => categoryIds(e).includes(activeId)) : entries
  const cards = visible.map((post) => toCardEntry(post, kind, ctx.locale, ctx.origin, subCategory(post, section)?.title ?? undefined))
  const base = href(ctx.locale, kind)

  return (
    <PageShell locale={ctx.locale} active={sectionActive(ctx.locale, kind)} language={language}>
      <div className="container page">
        <PageTitle
          number={sectionNumber(kind, ctx.locale)}
          eyebrow={t[kind]}
          title={intro?.title || t[kind]}
          lead={intro?.hero?.richText ? <RichText data={intro.hero.richText} locale={ctx.locale} origin={ctx.origin} variant="lead" /> : null}
        />

        {options.length > 1 ? (
          <Filters locale={ctx.locale} base={base} options={options} active={activeCategory?.key} total={entries.length} />
        ) : null}

        {cards.length ? (
          <EntryGrid entries={cards} locale={ctx.locale} variant={kind === 'projects' ? 'project' : 'editorial'} prioritise={2} />
        ) : (
          <EmptyState>
            {category && entries.length ? t.emptyFilter : entryCopy(t, kind).empty}
          </EmptyState>
        )}
      </div>
    </PageShell>
  )
}

export async function EntryView({
  kind,
  post,
  ctx,
  language,
}: {
  kind: EntryKind
  post: Post
  ctx: RenderContext
  language: LocaleLink | null
}) {
  const t = copy[ctx.locale]
  const [section, siblings] = await Promise.all([getSectionCategories(kind, ctx.locale), getEntries(kind, ctx.locale)])
  const { facts, body } =
    kind === 'projects' ? projectFactsAndBody(post, ctx.locale) : { facts: [], body: post.content ?? null }
  const hero = resolveMedia(post.heroImage, ctx.origin, post.title ?? '')
  const cat = subCategory(post, section)

  const meta: MetaItem[] = []
  if (cat?.title) meta.push({ label: t.category, value: cat.title })
  for (const f of facts) meta.push({ label: f.label, value: f.value })
  if (isArticle(kind)) {
    const date = formatDate(post.publishedAt, ctx.locale)
    if (date) meta.push({ label: t.published, value: <time dateTime={post.publishedAt ?? undefined}>{date}</time> })
    const authors = (post.populatedAuthors ?? []).map((a) => a.name).filter(Boolean)
    if (authors.length) meta.push({ label: t.author, value: authors.join(ctx.locale === 'fa' ? '، ' : ', ') })
  }

  const inSection = new Set(siblings.map((s) => s.id))
  const related = (post.relatedPosts ?? [])
    .filter((p): p is Post => typeof p === 'object' && p !== null && inSection.has(p.id))
    .map((p) => siblings.find((s) => s.id === p.id)!)
  const index = siblings.findIndex((s) => s.id === post.id)
  const adjacent =
    siblings.length > 1
      ? [1, 2]
          .map((step) => siblings[(index + step) % siblings.length])
          .filter((p, i, arr): p is Post => Boolean(p) && p!.id !== post.id && arr.findIndex((o) => o?.id === p!.id) === i)
      : []
  const more = (related.length ? related : adjacent).slice(0, kind === 'projects' ? 2 : 3)
  const moreTitle = related.length ? entryCopy(t, kind).related : entryCopy(t, kind).next
  // Newest first, so "previous" is the newer neighbour and "next" the older one.
  const newer = index > 0 ? siblings[index - 1] : undefined
  const older = index >= 0 ? siblings[index + 1] : undefined

  return (
    <PageShell locale={ctx.locale} active={sectionActive(ctx.locale, kind, false)} language={language}>
      <div className="reading-progress" role="presentation" aria-hidden="true" />
      <article className={`container page entry entry--${kind}`}>
        <PageTitle
          number={sectionNumber(kind, ctx.locale)}
          eyebrow={t[kind]}
          eyebrowHref={href(ctx.locale, kind)}
          title={post.title ?? ''}
          lead={post.meta?.description ? <p>{post.meta.description}</p> : null}
        >
          <MetaList items={meta} />
        </PageTitle>

        {hero ? (
          <div className="entry__hero">
            <MediaFrame media={hero} locale={ctx.locale} priority sizes="(min-width: 1500px) 1400px, 94vw" caption={hero.caption} />
          </div>
        ) : null}

        <RichText data={body} locale={ctx.locale} origin={ctx.origin} className="entry__body" />

        <RelatedEntries
          title={moreTitle}
          locale={ctx.locale}
          variant={kind === 'projects' ? 'project' : 'editorial'}
          entries={more.map((p) => toCardEntry(p, kind, ctx.locale, ctx.origin, subCategory(p, section)?.title ?? undefined))}
        />

        {newer || older ? (
          <nav className="entry__pager" aria-label={t[kind]}>
            {newer ? (
              <Link className="entry__pager-link entry__pager-link--prev" href={href(ctx.locale, `${kind}/${encodeURIComponent(newer.slug ?? '')}`)} rel="prev">
                <span className="entry__pager-label">
                  <span className="arrow arrow--back" aria-hidden="true" /> {t.previousEntry}
                </span>
                <span className="entry__pager-title">{newer.title}</span>
              </Link>
            ) : (
              <span />
            )}
            {older ? (
              <Link className="entry__pager-link entry__pager-link--next" href={href(ctx.locale, `${kind}/${encodeURIComponent(older.slug ?? '')}`)} rel="next">
                <span className="entry__pager-label">
                  {t.nextEntry} <span className="arrow" aria-hidden="true" />
                </span>
                <span className="entry__pager-title">{older.title}</span>
              </Link>
            ) : null}
          </nav>
        ) : null}

        <nav className="entry__back" aria-label={t[kind]}>
          <span className="rule rule--marked" aria-hidden="true" />
          <Link className="text-link text-link--large" href={href(ctx.locale, kind)}>
            <span className="arrow arrow--back" aria-hidden="true" /> {t.backTo} {t[kind]}
          </Link>
        </nav>
      </article>
    </PageShell>
  )
}

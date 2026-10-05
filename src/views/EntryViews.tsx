import Link from 'next/link'

import { RichText } from '@/components/content/RichText'
import { EmptyState, Inquiry, MetaList, PageTitle, SectionHeading, Toc, type MetaItem, type StateAction } from '@/components/editorial/Editorial'
import { EntryGrid, toCardEntries, toCardEntry } from '@/components/entries/EntryCard'
import { Filters } from '@/components/entries/Filters'
import { RelatedEntries } from '@/components/entries/RelatedEntries'
import { PageShell, sectionActive } from '@/components/layout/PageShell'
import { Gallery } from '@/components/media/Gallery'
import { MediaFrame } from '@/components/media/MediaFrame'
import { getEntries, getSectionCategories, type SectionCategories } from '@/lib/cms'
import type { RenderContext } from '@/lib/context'
import { copy, formatDate, href, interpolate, otherLocale, sectionNumber } from '@/lib/i18n'
import { resolveMedia, type ResolvedMedia } from '@/lib/media'
import { sectionAvailable } from '@/lib/navigation'
import { projectFactsAndBody } from '@/lib/project-metadata'
import { moreEntries } from '@/lib/continuation'
import { headingAnchors, mediaKey, splitBodyImages, withoutMedia } from '@/lib/richtext'
import { toLocaleDigits } from '@eshobe/site-runtime'
import type { EntryKind, LocaleLink, Media, Page, Post } from '@/lib/types'

/** Copy that differs per section: empty state and the "more like this" headings. */
const entryCopy = (t: (typeof copy)['fa'], kind: EntryKind) =>
  kind === 'projects'
    ? { empty: t.emptyProjects, related: t.relatedProjects, next: t.nextProjects }
    : kind === 'blog'
      ? { empty: t.emptyBlog, related: t.relatedBlog, next: t.nextBlog }
      : { empty: t.emptyEducation, related: t.relatedEducation, next: t.nextEducation }

/** A long project gets section anchors; a short one reads fine without them. */
const MIN_ANCHORS = 3

const categoryIds = (post: Post) =>
  (post.categories ?? []).map((c) => (typeof c === 'string' ? c : c?.id)).filter((id): id is string => Boolean(id))

/** The most specific category below the section root, titled in this locale. */
function subCategory(post: Post, section: SectionCategories) {
  const ids = categoryIds(post)
  return section.children.find((c) => ids.includes(c.id)) ?? null
}

/** Where a visitor can go from an empty listing: the other language if it has entries, else contact and home. */
async function emptyActions(kind: EntryKind, ctx: RenderContext): Promise<{ message?: string; actions: StateAction[] }> {
  const t = copy[ctx.locale]
  const actions: StateAction[] = []
  let message: string | undefined
  if (ctx.otherServed) {
    const other = otherLocale(ctx.locale)
    if ((await getEntries(kind, other)).length) {
      message = t.emptyOtherLocale
      actions.push({ href: href(other, kind), label: copy[other][kind], hrefLang: other })
    }
  }
  if (await sectionAvailable('contact', ctx.locale)) actions.push({ href: href(ctx.locale, 'contact'), label: t.contact })
  actions.push({ href: href(ctx.locale), label: t.home })
  return { message, actions }
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
  const cards = toCardEntries(visible, (post) =>
    toCardEntry(post, kind, ctx.locale, ctx.origin, subCategory(post, section)?.title ?? undefined),
  )
  const base = href(ctx.locale, kind)
  const filteredOut = Boolean(category) && entries.length > 0
  const empty = cards.length
    ? null
    : filteredOut
      ? { message: t.emptyFilter, actions: [{ href: base, label: t.viewAll }] }
      : await emptyActions(kind, ctx)

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

        {empty ? (
          <EmptyState actions={empty.actions}>{empty.message ?? entryCopy(t, kind).empty}</EmptyState>
        ) : (
          <EntryGrid entries={cards} locale={ctx.locale} variant={kind === 'projects' ? 'project' : 'editorial'} prioritise={2} />
        )}
      </div>
    </PageShell>
  )
}

/** Previous/next by publication order, newest first: "previous" is the newer neighbour. */
function Pager({ kind, siblings, post, ctx }: { kind: EntryKind; siblings: Post[]; post: Post; ctx: RenderContext }) {
  const t = copy[ctx.locale]
  const index = siblings.findIndex((s) => s.id === post.id)
  const newer = index > 0 ? siblings[index - 1] : undefined
  const older = index >= 0 ? siblings[index + 1] : undefined
  if (!newer && !older) return null
  const link = (p: Post) => href(ctx.locale, `${kind}/${encodeURIComponent(p.slug ?? '')}`)
  return (
    <nav className="entry__pager" aria-label={t[kind]}>
      {newer ? (
        <Link className="entry__pager-link entry__pager-link--prev" href={link(newer)} rel="prev">
          <span className="entry__pager-label">
            <span className="arrow arrow--back" aria-hidden="true" /> {t.previousEntry}
          </span>
          <span className="entry__pager-title">{newer.title}</span>
        </Link>
      ) : (
        <span />
      )}
      {older ? (
        <Link className="entry__pager-link entry__pager-link--next" href={link(older)} rel="next">
          <span className="entry__pager-label">
            {t.nextEntry} <span className="arrow" aria-hidden="true" />
          </span>
          <span className="entry__pager-title">{older.title}</span>
        </Link>
      ) : null}
    </nav>
  )
}

function BackLink({ kind, ctx }: { kind: EntryKind; ctx: RenderContext }) {
  const t = copy[ctx.locale]
  return (
    <nav className="entry__back" aria-label={t[kind]}>
      <span className="rule rule--marked" aria-hidden="true" />
      <Link className="text-link text-link--large" href={href(ctx.locale, kind)}>
        <span className="arrow arrow--back" aria-hidden="true" /> {kind === 'projects' ? t.allProjects : `${t.backTo} ${t[kind]}`}
      </Link>
    </nav>
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
  if (kind === 'projects') return <ProjectView post={post} ctx={ctx} language={language} />

  const t = copy[ctx.locale]
  const [section, siblings] = await Promise.all([getSectionCategories(kind, ctx.locale), getEntries(kind, ctx.locale)])
  const hero = resolveMedia(post.heroImage, ctx.origin, post.title ?? '')
  const body = withoutMedia(post.content, [mediaKey(post.heroImage as Media | null)])
  const cat = subCategory(post, section)

  const meta: MetaItem[] = []
  if (cat?.title) meta.push({ label: t.category, value: cat.title })
  const date = formatDate(post.publishedAt, ctx.locale)
  if (date) meta.push({ label: t.published, value: <time dateTime={post.publishedAt ?? undefined}>{date}</time> })
  const authors = (post.populatedAuthors ?? []).map((a) => a.name).filter(Boolean)
  if (authors.length) meta.push({ label: t.author, value: authors.join(ctx.locale === 'fa' ? '، ' : ', ') })

  const more = moreEntries(post, siblings)

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
            <MediaFrame media={hero} locale={ctx.locale} priority sizes="(min-width: 1040px) 960px, 92vw" caption={hero.caption} />
          </div>
        ) : null}

        <RichText data={body} locale={ctx.locale} origin={ctx.origin} className="entry__body" />

        <RelatedEntries
          title={more.related ? entryCopy(t, kind).related : entryCopy(t, kind).next}
          locale={ctx.locale}
          variant="editorial"
          entries={toCardEntries(more.items, (p) => toCardEntry(p, kind, ctx.locale, ctx.origin, subCategory(p, section)?.title ?? undefined))}
        />
        <Pager kind={kind} siblings={siblings} post={post} ctx={ctx} />
        <BackLink kind={kind} ctx={ctx} />
      </article>
    </PageShell>
  )
}

/**
 * A project reads as: introduction (title, standfirst) → hero → compact facts → section
 * anchors when the text is long → the narrative → every other image once, as one gallery
 * → where to go next → a way to start a conversation. The hero is never repeated in the
 * gallery, and no image appears twice.
 */
async function ProjectView({ post, ctx, language }: { post: Post; ctx: RenderContext; language: LocaleLink | null }) {
  const kind: EntryKind = 'projects'
  const t = copy[ctx.locale]
  const [section, siblings, contact] = await Promise.all([
    getSectionCategories(kind, ctx.locale),
    getEntries(kind, ctx.locale),
    sectionAvailable('contact', ctx.locale),
  ])
  const hero = resolveMedia(post.heroImage, ctx.origin, post.title ?? '')
  const { facts, body: narrative } = projectFactsAndBody(post, ctx.locale)
  const { body, images } = splitBodyImages(narrative, [mediaKey(post.heroImage as Media | null)])
  const gallery = images
    .map((m) => resolveMedia(m, ctx.origin, post.title ?? ''))
    .filter((m): m is ResolvedMedia => m?.kind === 'image')
  const anchors = headingAnchors(body)
  const cat = subCategory(post, section)
  const meta: MetaItem[] = [...(cat?.title ? [{ label: t.category, value: cat.title }] : []), ...facts]
  const more = moreEntries(post, siblings)
  const title = post.title ?? ''
  const inquiryHref = `${href(ctx.locale, 'contact')}?project=${encodeURIComponent(title.slice(0, 120))}#contact-form`

  return (
    <PageShell locale={ctx.locale} active={sectionActive(ctx.locale, kind, false)} language={language}>
      <div className="reading-progress" role="presentation" aria-hidden="true" />
      <article className="container page entry entry--projects">
        <PageTitle
          number={sectionNumber(kind, ctx.locale)}
          eyebrow={t[kind]}
          eyebrowHref={href(ctx.locale, kind)}
          title={title}
          lead={post.meta?.description ? <p>{post.meta.description}</p> : null}
        />

        {hero ? (
          <div className="entry__hero">
            <MediaFrame media={hero} locale={ctx.locale} priority sizes="(min-width: 1040px) 960px, 92vw" caption={hero.caption} />
          </div>
        ) : null}

        <MetaList items={meta} className="meta-list--facts" />

        {anchors.length >= MIN_ANCHORS ? <Toc title={t.onThisPage} anchors={anchors} /> : null}

        <RichText data={body} locale={ctx.locale} origin={ctx.origin} className="entry__body" anchors />

        {gallery.length ? (
          <section className="entry__gallery" aria-label={t.gallery}>
            <SectionHeading
              title={t.gallery}
              intro={interpolate(t.imageCount, { n: toLocaleDigits(String(gallery.length), ctx.locale) })}
            />
            <Gallery images={gallery} locale={ctx.locale} columns={gallery.length === 1 ? 1 : gallery.length === 2 ? 2 : 3} />
          </section>
        ) : null}

        <Pager kind={kind} siblings={siblings} post={post} ctx={ctx} />

        <RelatedEntries
          title={more.related ? t.relatedProjects : t.nextProjects}
          locale={ctx.locale}
          variant="project"
          entries={toCardEntries(more.items, (p) => toCardEntry(p, kind, ctx.locale, ctx.origin, subCategory(p, section)?.title ?? undefined))}
        />

        {contact ? <Inquiry title={t.inquiryTitle} body={t.inquiryBody} action={{ href: inquiryHref, label: t.inquiryAction }} /> : null}

        <BackLink kind={kind} ctx={ctx} />
      </article>
    </PageShell>
  )
}

import Link from 'next/link'

import { MediaFrame } from '@/components/media/MediaFrame'
import { formatDate, href, indexNumber } from '@/lib/i18n'
import { resolveMedia, type ResolvedMedia } from '@/lib/media'
import { projectCardLine } from '@/lib/project-metadata'
import type { EntryKind, Locale, Post } from '@/lib/types'

export type CardEntry = {
  id: string
  href: string
  title: string
  image: ResolvedMedia | null
  category?: string
  date?: string
  /** Project facts line (location · year) or an article's excerpt. */
  excerpt?: string
}

/**
 * A card for an entry that exists in `locale`, or null. Without a title and a slug in
 * this language there is nothing to show and nowhere to link: such a card used to render
 * blank and point at `/en/projects/undefined` (or, with an empty slug, at the archive).
 * The cover is the hero, else the SEO image; a video contributes only its poster.
 */
export function toCardEntry(
  post: Post,
  kind: EntryKind,
  locale: Locale,
  origin: string,
  category?: string,
): CardEntry | null {
  const title = post.title?.trim()
  const slug = post.slug?.trim()
  if (!title || !slug) return null
  const media = resolveMedia(post.heroImage, origin, title) ?? resolveMedia(post.meta?.image, origin, title)
  const image =
    media?.kind === 'video'
      ? media.poster
        ? { ...media, kind: 'image' as const, src: media.poster, srcSet: undefined }
        : null
      : media
  return {
    id: post.id,
    href: href(locale, `${kind}/${encodeURIComponent(slug)}`),
    title,
    image,
    category,
    date: kind !== 'projects' ? formatDate(post.publishedAt, locale) : undefined,
    excerpt: kind === 'projects' ? projectCardLine(post, locale) || undefined : post.meta?.description ?? undefined,
  }
}

export const toCardEntries = (posts: Post[], toCard: (post: Post) => CardEntry | null): CardEntry[] =>
  posts.map(toCard).filter((entry): entry is CardEntry => Boolean(entry))

/** The box width the grid hands a card, by how many cards share the row (media.css). */
export function cardSizes(count: number): string {
  if (count === 1) return '(min-width: 820px) 760px, 92vw'
  if (count === 2) return '(min-width: 521px) 46vw, 92vw'
  return '(min-width: 1081px) 30vw, (min-width: 521px) 46vw, 92vw'
}

export function EntryCard({
  entry,
  locale,
  index,
  variant,
  headingLevel = 2,
  priority = false,
  sizes = cardSizes(3),
}: {
  entry: CardEntry
  locale: Locale
  index: number
  variant: 'project' | 'editorial'
  headingLevel?: 2 | 3
  priority?: boolean
  sizes?: string
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const ratio = variant === 'project' ? '4/3' : '3/2'
  return (
    <article className={`card card--${variant} ${entry.image ? '' : 'card--text'}`.trim()}>
      <Link className="card__link" href={entry.href}>
        {entry.image ? (
          <MediaFrame as="span" media={entry.image} locale={locale} ratio={ratio} priority={priority} sizes={sizes} />
        ) : null}
        <span className="card__body">
          <span className="card__meta">
            <span className="num">{indexNumber(index, locale)}</span>
            {entry.category ? <span>{entry.category}</span> : null}
            {entry.date ? <time>{entry.date}</time> : null}
          </span>
          <Heading className="card__title">{entry.title}</Heading>
          {entry.excerpt ? <span className="card__excerpt">{entry.excerpt}</span> : null}
        </span>
        <span className="card__arrow arrow" aria-hidden="true" />
      </Link>
    </article>
  )
}

export function EntryGrid({
  entries,
  locale,
  variant,
  headingLevel = 2,
  prioritise = 0,
}: {
  entries: CardEntry[]
  locale: Locale
  variant: 'project' | 'editorial'
  headingLevel?: 2 | 3
  prioritise?: number
}) {
  if (!entries.length) return null
  const count = Math.min(entries.length, 3)
  return (
    <ul className={`entry-grid entry-grid--${variant}`} role="list" data-count={count} data-reveal="">
      {entries.map((entry, i) => (
        <li key={entry.id}>
          <EntryCard
            entry={entry}
            locale={locale}
            index={i}
            variant={variant}
            headingLevel={headingLevel}
            priority={i < prioritise}
            sizes={cardSizes(count)}
          />
        </li>
      ))}
    </ul>
  )
}

import Link from 'next/link'

import { MediaFrame } from '@/components/media/MediaFrame'
import { formatDate, href, indexNumber } from '@/lib/i18n'
import { resolveMedia, type ResolvedMedia } from '@/lib/media'
import type { EntryKind, Locale, Post } from '@/lib/types'

export type CardEntry = {
  id: string
  href: string
  title: string
  image: ResolvedMedia | null
  category?: string
  date?: string
  excerpt?: string
}

/** Cover image for a card: the hero, else the SEO image; a video contributes only its poster. */
export function toCardEntry(
  post: Post,
  kind: EntryKind,
  locale: Locale,
  origin: string,
  category?: string,
): CardEntry {
  const media = resolveMedia(post.heroImage, origin, post.title ?? '') ?? resolveMedia(post.meta?.image, origin, post.title ?? '')
  const image =
    media?.kind === 'video'
      ? media.poster
        ? { ...media, kind: 'image' as const, src: media.poster, srcSet: undefined }
        : null
      : media
  return {
    id: post.id,
    href: href(locale, `${kind}/${encodeURIComponent(post.slug ?? '')}`),
    title: post.title ?? '',
    image,
    category,
    date: kind !== 'projects' ? formatDate(post.publishedAt, locale) : undefined,
    excerpt: kind !== 'projects' ? post.meta?.description ?? undefined : undefined,
  }
}

export function EntryCard({
  entry,
  locale,
  index,
  variant,
  headingLevel = 2,
  priority = false,
}: {
  entry: CardEntry
  locale: Locale
  index: number
  variant: 'project' | 'editorial'
  headingLevel?: 2 | 3
  priority?: boolean
}) {
  const Heading = `h${headingLevel}` as 'h2' | 'h3'
  const ratio = variant === 'project' ? '4/3' : '3/2'
  return (
    <article className={`card card--${variant}`}>
      <Link className="card__link" href={entry.href}>
        {entry.image ? (
          <MediaFrame
            as="span"
            media={entry.image}
            locale={locale}
            ratio={ratio}
            priority={priority}
            /* Both variants share one grid (3 per row on a desktop canvas, 2 below),
               so they share one width hint: ~30vw in a third of the content column,
               ~46vw in half of it. */
            sizes="(min-width: 1081px) 30vw, 46vw"
          />
        ) : (
          <span className="frame frame--inset frame--fixed frame--empty" style={{ ['--ratio' as string]: ratio }}>
            <span className="frame__media" />
          </span>
        )}
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
  return (
    <ul className={`entry-grid entry-grid--${variant}`} role="list" data-reveal="">
      {entries.map((entry, i) => (
        <li key={entry.id}>
          <EntryCard
            entry={entry}
            locale={locale}
            index={i}
            variant={variant}
            headingLevel={headingLevel}
            priority={i < prioritise}
          />
        </li>
      ))}
    </ul>
  )
}

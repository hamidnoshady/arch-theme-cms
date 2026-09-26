import { SectionHeading } from '@/components/editorial/Editorial'
import type { Locale } from '@/lib/types'

import { EntryGrid, type CardEntry } from './EntryCard'

export function RelatedEntries({
  title,
  entries,
  locale,
  variant,
}: {
  title: string
  entries: CardEntry[]
  locale: Locale
  variant: 'project' | 'editorial'
}) {
  if (!entries.length) return null
  return (
    <section className="related" aria-label={title}>
      <SectionHeading title={title} />
      <EntryGrid entries={entries} locale={locale} variant={variant} headingLevel={3} />
    </section>
  )
}

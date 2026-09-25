import Link from 'next/link'

import { copy } from '@/lib/i18n'
import { toLocaleDigits } from '@/lib/runtime'
import type { Locale } from '@/lib/types'

export type FilterOption = { key: string; label: string; count: number }

export function Filters({
  locale,
  base,
  options,
  active,
  total,
}: {
  locale: Locale
  base: string
  options: FilterOption[]
  active?: string
  total: number
}) {
  const t = copy[locale]
  const items = [{ key: '', label: t.all, count: total }, ...options]
  return (
    <nav className="filters" aria-label={t.filterLabel}>
      <ul className="filters__list" role="list">
        {items.map((item) => {
          const current = (active ?? '') === item.key
          return (
            <li key={item.key || 'all'}>
              <Link
                className="filters__link"
                href={item.key ? `${base}?category=${encodeURIComponent(item.key)}` : base}
                aria-current={current ? 'page' : undefined}
                scroll={false}
              >
                <span>{item.label}</span>
                <span className="filters__count num">{toLocaleDigits(String(item.count), locale)}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}

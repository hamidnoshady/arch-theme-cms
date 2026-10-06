import Link from 'next/link'

import { copy, otherLocale } from '@/lib/i18n'
import type { Locale, LocaleLink } from '@/lib/types'

/**
 * Opens the translation of the current page. When there is none, the link goes to
 * the nearest translated parent (the section index or home) and says so, instead
 * of advertising a page that does not exist.
 */
export function LanguageSwitch({
  locale,
  link,
  variant = 'short',
  className = '',
}: {
  locale: Locale
  link: LocaleLink | null
  variant?: 'short' | 'long'
  className?: string
}) {
  if (!link) return null
  const t = copy[locale]
  const target = otherLocale(locale)
  const note = link.available ? t.switchLabel : t.switchUnavailable
  return (
    <Link
      className={`lang-switch ${link.available ? '' : 'lang-switch--fallback'} ${className}`}
      href={link.href}
      hrefLang={target}
      lang={target}
      title={note}
      data-available={link.available}
    >
      <span aria-hidden="true">{variant === 'short' ? t.switchToShort : t.switchTo}</span>
      <span className="sr-only" lang={locale}>
        {note}
      </span>
    </Link>
  )
}

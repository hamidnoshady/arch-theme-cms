import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { SECTIONS, copy, href, sectionNumber } from '@/lib/i18n'
import type { Locale, LocaleLink, Section } from '@/lib/types'

import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'

export function SiteHeader({
  locale,
  section,
  exact,
  language,
}: {
  locale: Locale
  section?: Section | null
  /** True on the section index itself, false on a child page (project detail). */
  exact?: boolean
  language: LocaleLink | null
}) {
  const t = copy[locale]
  const items = SECTIONS.map((key) => ({
    key,
    href: href(locale, key),
    label: t[key],
    number: sectionNumber(key, locale),
    current: key === section ? (exact ? ('page' as const) : ('true' as const)) : undefined,
  }))

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href={href(locale)}>
          <Logo variant="compact" />
          <span className="sr-only">
            {t.brand} — {t.home}
          </span>
        </Link>

        <nav className="site-nav" aria-label={t.primaryNav}>
          <ol className="site-nav__list">
            {items.map((item) => (
              <li key={item.key}>
                <Link className="site-nav__link" href={item.href} aria-current={item.current}>
                  <span className="site-nav__number" aria-hidden="true">
                    {item.number}
                  </span>
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ol>
        </nav>

        <div className="site-header__end">
          <LanguageSwitch locale={locale} link={language} />
          <MobileMenu
            locale={locale}
            items={items.map(({ key, href: h, label, number, current }) => ({
              key,
              href: h,
              label,
              number,
              current: Boolean(current),
            }))}
            language={language}
          />
        </div>
      </div>
    </header>
  )
}

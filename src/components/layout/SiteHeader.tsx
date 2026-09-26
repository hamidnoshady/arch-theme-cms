import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { getSite } from '@/lib/cms'
import { copy, href } from '@/lib/i18n'
import { getPrimaryNavigation, navItemActive, type ActiveNav } from '@/lib/navigation'
import { resolveBranding } from '@/lib/theme/branding'
import type { Locale, LocaleLink } from '@/lib/types'

import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'

export async function SiteHeader({
  locale,
  active,
  language,
}: {
  locale: Locale
  active?: ActiveNav | null
  language: LocaleLink | null
}) {
  const t = copy[locale]
  const site = await getSite()
  const branding = resolveBranding(site, locale)
  const nav = await getPrimaryNavigation(locale, site)
  const items = nav.map((item) => ({
    key: item.id,
    href: item.href,
    label: item.label,
    number: item.number,
    current: navItemActive(item.href, active),
    external: item.external,
    newTab: item.newTab,
  }))

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href={href(locale)}>
          <Logo variant="compact" branding={branding} />
          <span className="sr-only">
            {branding.brandLabel} — {t.home}
          </span>
        </Link>

        <nav className="site-nav" aria-label={t.primaryNav}>
          <ol className="site-nav__list">
            {items.map((item) => (
              <li key={item.key}>
                {item.external ? (
                  <a
                    className="site-nav__link"
                    href={item.href}
                    aria-current={item.current}
                    {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    <span className="site-nav__number" aria-hidden="true">
                      {item.number}
                    </span>
                    <span>{item.label}</span>
                  </a>
                ) : (
                  <Link className="site-nav__link" href={item.href} aria-current={item.current}>
                    <span className="site-nav__number" aria-hidden="true">
                      {item.number}
                    </span>
                    <span>{item.label}</span>
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        <div className="site-header__end">
          <LanguageSwitch locale={locale} link={language} />
          <MobileMenu
            locale={locale}
            items={items.map(({ key, href: h, label, number, current, external, newTab }) => ({
              key,
              href: h,
              label,
              number,
              current: Boolean(current),
              external,
              newTab,
            }))}
            language={language}
          />
        </div>
      </div>
    </header>
  )
}

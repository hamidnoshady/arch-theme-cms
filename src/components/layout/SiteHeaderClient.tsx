'use client'

import Link from 'next/link'
import { useMemo } from 'react'

import { Logo } from '@/components/brand/Logo'
import { copy, href } from '@/lib/i18n'
import type { ResolvedBranding } from '@/lib/theme/branding'
import type { Locale, LocaleLink } from '@/lib/types'

import { LanguageSwitch } from './LanguageSwitch'
import { MobileMenu } from './MobileMenu'

type Item = {
  key: string
  href: string
  label: string
  number: string
  current?: boolean
  external?: boolean
  newTab?: boolean
}

type Props = {
  locale: Locale
  items: Item[]
  branding: ResolvedBranding
  homeLabel: string
  language: LocaleLink | null
}

/**
 * Sticky chrome. Brand, copy and navigation arrive as serialised props from the
 * server shell (CMS data unchanged); hydration lets the active rule follow the
 * router between client navigations.
 */
export function SiteHeaderClient({ locale, items, branding, homeLabel, language }: Props) {
  const activeIndex = useMemo(() => items.findIndex((item) => item.current), [items])
  const mobileMenuItems = useMemo(
    () =>
      items.map(({ key, href: h, label, number, current, external, newTab }) => ({
        key,
        href: h,
        label,
        number,
        current: Boolean(current),
        external,
        newTab,
      })),
    [items],
  )

  return (
    <header className="site-header">
      <div className="site-header__inner">
        <Link className="site-header__brand" href={href(locale)}>
          <Logo variant="compact" branding={branding} />
          <span className="sr-only">
            {branding.brandLabel} — {homeLabel}
          </span>
        </Link>

        <nav className="site-nav" aria-label={copy[locale].primaryNav}>
          <ol className="site-nav__list" style={{ ['--active-i' as string]: activeIndex }}>
            {items.map((item, i) => {
              const link = item.current ? 'site-nav__link site-nav__link--active' : 'site-nav__link'
              const inner = (
                <>
                  <span className="site-nav__number" aria-hidden="true">
                    {item.number}
                  </span>
                  <span>{item.label}</span>
                </>
              )
              return (
                <li key={item.key}>
                  {item.external ? (
                    <a
                      className={link}
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      data-i={i}
                      {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      {inner}
                    </a>
                  ) : (
                    <Link
                      className={link}
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      data-i={i}
                    >
                      {inner}
                    </Link>
                  )}
                </li>
              )
            })}
          </ol>
          <span className="site-nav__active-rule" aria-hidden="true" />
        </nav>

        <div className="site-header__end">
          <LanguageSwitch locale={locale} link={language} />
          <MobileMenu
            locale={locale}
            branding={branding}
            items={mobileMenuItems}
            language={language}
          />
        </div>
      </div>
    </header>
  )
}

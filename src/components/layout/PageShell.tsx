import { copy, href } from '@/lib/i18n'
import type { ActiveNav } from '@/lib/navigation'
import type { Locale, LocaleLink } from '@/lib/types'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'
import { SmoothAnchors } from './SmoothAnchors'

export function PageShell({
  locale,
  active,
  language,
  children,
}: {
  locale: Locale
  active?: ActiveNav | null
  language: LocaleLink | null
  children: React.ReactNode
}) {
  return (
    <div className="shell" id="top">
      <SmoothAnchors />
      <a className="skip-link" href="#content">
        {copy[locale].skipToContent}
      </a>
      <SiteHeader locale={locale} active={active} language={language} />
      <main id="content" className="shell__main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

/** Convenience for section index pages. */
export function sectionActive(locale: Locale, section: string, exact = true): ActiveNav {
  return { path: href(locale, section), exact }
}

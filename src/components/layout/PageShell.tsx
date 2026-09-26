import { copy } from '@/lib/i18n'
import type { Locale, LocaleLink, Section } from '@/lib/types'

import { SiteFooter } from './SiteFooter'
import { SiteHeader } from './SiteHeader'

export function PageShell({
  locale,
  section,
  exact = true,
  language,
  children,
}: {
  locale: Locale
  section?: Section | null
  exact?: boolean
  language: LocaleLink | null
  children: React.ReactNode
}) {
  return (
    <div className="shell" id="top">
      <a className="skip-link" href="#content">
        {copy[locale].skipToContent}
      </a>
      <SiteHeader locale={locale} section={section} exact={exact} language={language} />
      <main id="content" className="shell__main" tabIndex={-1}>
        {children}
      </main>
      <SiteFooter locale={locale} />
    </div>
  )
}

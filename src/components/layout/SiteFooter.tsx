import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { getSite } from '@/lib/cms'
import { copy, href } from '@/lib/i18n'
import { getFooterNavigation } from '@/lib/navigation'
import { resolveBranding } from '@/lib/theme/branding'
import { formatDate } from '@eshobe/site-runtime'
import type { Locale } from '@/lib/types'

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const site = await getSite()
  const branding = resolveBranding(site, locale)
  const links = await getFooterNavigation(locale, site)

  return (
    <footer className="site-footer" data-reveal="">
      <div className="site-footer__inner">
        <Link className="site-footer__brand" href={href(locale)} aria-label={branding.brandLabel}>
          <Logo variant="compact" branding={branding} />
        </Link>

        {links.length ? (
          <nav className="site-footer__nav" aria-label={t.footerNav}>
            <ul>
              {links.map((l) => (
                <li key={l.id}>
                  {l.external ? (
                    <a className="text-link" href={l.href} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {l.label}
                    </a>
                  ) : (
                    <Link className="text-link" href={l.href} {...(l.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ) : null}

        <div className="site-footer__end">
          <a className="text-link" href="#top">
            {t.backToTop}
          </a>
          <span>
            © {formatDate(new Date(), locale, { year: 'numeric' })} {branding.shortName || t.brand}
          </span>
        </div>
      </div>
    </footer>
  )
}

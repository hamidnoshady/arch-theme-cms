import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { getNav } from '@/lib/cms'
import { copy, href } from '@/lib/i18n'
import { resolveLink, safeHref } from '@/lib/links'
import { formatDate } from '@/lib/runtime'
import type { Locale } from '@/lib/types'

export async function SiteFooter({ locale }: { locale: Locale }) {
  const t = copy[locale]
  const footer = await getNav('footer', locale)
  const links = (footer?.navItems ?? [])
    .map((item) => ({ id: item.id, label: item.link?.label, link: resolveLink(item.link, locale) }))
    .filter((l) => l.label && l.link && safeHref(l.link.href))

  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <Link className="site-footer__brand" href={href(locale)} aria-label={t.home}>
          <Logo variant="compact" />
        </Link>

        {links.length ? (
          <nav className="site-footer__nav" aria-label={t.footerNav}>
            <ul>
              {links.map((l) => (
                <li key={l.id ?? l.link!.href}>
                  <a
                    className="text-link"
                    href={l.link!.href}
                    {...(l.link!.newTab || l.link!.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  >
                    {l.label}
                  </a>
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
            © {formatDate(new Date(), locale, { year: 'numeric' })} {t.rights}
          </span>
        </div>
      </div>
    </footer>
  )
}

'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Logo } from './Logo';
import { copy, href, navKeys } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export function Shell({
  locale,
  children,
  path = '',
}: {
  locale: Locale;
  children: React.ReactNode;
  path?: string;
}) {
  const t = copy[locale];
  const [open, setOpen] = useState(false);
  const langPath = locale === 'fa' ? `/en/${path}` : `/${path}`;
  const langHref = langPath.replace(/\/$/, '') || (locale === 'fa' ? '/en' : '/');

  return (
    <>
      <header className="header">
        <Link href={href(locale)} aria-label="Graphite home">
          <Logo compact />
        </Link>
        <nav className="header-nav" aria-label="Primary">
          {navKeys.map((k) => (
            <Link key={k} href={href(locale, k)} onClick={() => setOpen(false)}>
              {t[k]}
            </Link>
          ))}
        </nav>
        <div className="header-end">
          <button
            type="button"
            className="menu-toggle"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? '×' : t.menu}
          </button>
          <Link
            className="language"
            href={langHref}
            hrefLang={locale === 'fa' ? 'en' : 'fa'}
          >
            {locale === 'fa' ? 'EN' : 'فا'}
          </Link>
        </div>
      </header>
      {open && (
        <nav id="mobile-nav" className="mobile-nav" aria-label="Primary">
          {navKeys.map((k) => (
            <Link key={k} href={href(locale, k)} onClick={() => setOpen(false)}>
              {t[k]}
            </Link>
          ))}
        </nav>
      )}
      <main>{children}</main>
      <footer>
        <Logo compact />
        <span>© {new Date().getFullYear()} GRAPHITE</span>
      </footer>
    </>
  );
}

export function PageTitle({
  number,
  title,
  intro,
}: {
  number?: string;
  title: string;
  intro?: string;
}) {
  return (
    <header className="page-title">
      {number && <span>{number}</span>}
      <h1>{title}</h1>
      {intro && <p>{intro}</p>}
    </header>
  );
}

export function Empty({ locale }: { locale: Locale }) {
  return <p className="empty">{copy[locale].empty}</p>;
}

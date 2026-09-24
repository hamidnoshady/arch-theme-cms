'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Logo } from './Logo';
import { LocaleDocument } from './LocaleDocument';
import { copy, href, navKeys } from '@/lib/i18n';
import type { Locale } from '@/lib/types';

export function Home({ locale }: { locale: Locale }) {
  const t = copy[locale];
  const [revealed, setRevealed] = useState(false);
  const [intro, setIntro] = useState(true);

  useEffect(() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce || sessionStorage.getItem('graphite-intro')) {
      setIntro(false);
      if (reduce) setRevealed(true);
    } else {
      sessionStorage.setItem('graphite-intro', '1');
      const id = setTimeout(() => setIntro(false), 2600);
      return () => clearTimeout(id);
    }
  }, []);

  useEffect(() => {
    let touch = 0;
    const wheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) > 12) setRevealed(e.deltaY > 0);
    };
    const down = (e: TouchEvent) => {
      touch = e.touches[0].clientY;
    };
    const up = (e: TouchEvent) => {
      const d = touch - e.changedTouches[0].clientY;
      if (Math.abs(d) > 25) setRevealed(d > 0);
    };
    addEventListener('wheel', wheel, { passive: true });
    addEventListener('touchstart', down, { passive: true });
    addEventListener('touchend', up, { passive: true });
    return () => {
      removeEventListener('wheel', wheel);
      removeEventListener('touchstart', down);
      removeEventListener('touchend', up);
    };
  }, []);

  const langHref = locale === 'fa' ? '/en' : '/';

  return (
    <LocaleDocument locale={locale}>
      <main
        className={`home ${revealed ? 'is-revealed' : ''} ${intro ? 'is-intro' : ''}`}
        onKeyDown={(e) => {
          if (['ArrowDown', 'PageDown', ' '].includes(e.key)) setRevealed(true);
          if (['ArrowUp', 'PageUp'].includes(e.key)) setRevealed(false);
        }}
        tabIndex={-1}
      >
        <div className="architecture" aria-hidden="true">
          <i />
          <b />
          <em />
        </div>
        {intro && (
          <button type="button" className="skip" onClick={() => setIntro(false)}>
            {t.skip}
          </button>
        )}
        <div className="home-center">
          <Logo animated={intro} />
          <button
            type="button"
            className="reveal"
            onClick={() => setRevealed(!revealed)}
            aria-expanded={revealed}
          >
            <span>{t.menu}</span>
          </button>
          <nav className="home-nav" aria-label="Primary">
            {navKeys.map((k, i) => (
              <Link key={k} href={href(locale, k)}>
                <small>0{i + 1}</small>
                <span>{t[k]}</span>
              </Link>
            ))}
          </nav>
        </div>
        {!revealed && (
          <p className="scroll-hint" aria-hidden="true">
            <span>{t.scroll}</span>
          </p>
        )}
        <Link className="home-language" href={langHref} hrefLang={locale === 'fa' ? 'en' : 'fa'}>
          {locale === 'fa' ? 'EN' : 'فا'}
        </Link>
      </main>
    </LocaleDocument>
  );
}

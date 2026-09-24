'use client';

import { useLayoutEffect } from 'react';
import type { Locale } from '@/lib/types';

/** Keeps document `lang` and `dir` aligned with the active locale (single root `<html>`). */
export function LocaleDocument({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  useLayoutEffect(() => {
    const lang = locale === 'fa' ? 'fa' : 'en';
    const dir = locale === 'fa' ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [locale]);

  return <>{children}</>;
}

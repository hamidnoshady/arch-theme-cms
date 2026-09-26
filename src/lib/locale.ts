/**
 * Locale helpers not exported by `@eshobe/site-runtime` (platform `src/lib/locales.ts`).
 */

export const locales = [
  { code: 'fa', label: 'فارسی', rtl: true },
  { code: 'en', label: 'English', rtl: false },
] as const

export const dirFor = (code: string): 'rtl' | 'ltr' =>
  locales.find((locale) => locale.code === code)?.rtl ? 'rtl' : 'ltr'

/** Prefix non-default locale on site-relative paths; pass through external URLs. */
export const localeHref = (path: string, locale: string, siteDefault: string): string =>
  path.startsWith('/') && locale !== siteDefault
    ? `/${locale}${path === '/' ? '' : path}`
    : path

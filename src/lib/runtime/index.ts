/**
 * Vendored subset of `@eshobe/site-runtime` (eshobe-cms `packages/site-runtime`,
 * commit 929e6c1). The package is not published to npm yet; when it is, replace
 * `@/lib/runtime` imports with `@eshobe/site-runtime` and delete this folder.
 * Money helpers are omitted — a portfolio site renders no prices.
 */

export * from './digits'
export * from './format'
export * from './theme'
export * from './blocks'
export * from './slug'

export const contractVersion = 1 as const

export const locales = [
  { code: 'fa', label: 'فارسی', rtl: true },
  { code: 'en', label: 'English', rtl: false },
] as const

export const isLocale = (code: unknown): code is 'fa' | 'en' => code === 'fa' || code === 'en'

export const dirFor = (code: string): 'rtl' | 'ltr' => (code === 'fa' ? 'rtl' : 'ltr')

/** Mirrors eshobe-cms `src/lib/locales.ts#localeHref`. */
export const localeHref = (path: string, locale: string, siteDefault: string): string =>
  path.startsWith('/') && locale !== siteDefault
    ? `/${locale}${path === '/' ? '' : path}`
    : path

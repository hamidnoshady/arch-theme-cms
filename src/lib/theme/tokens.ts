import { themeCss, type Theme } from '@eshobe/site-runtime'

import type { SiteDescriptor } from '@/lib/types'

/**
 * Maps CMS design tokens onto Graphite's semantic palette without accepting arbitrary CSS.
 * CMS `primary` tints Graphite navy; full `themeCss` handles background, foreground, radius, line-height.
 */
export function siteThemeStyle(site: SiteDescriptor | null): string {
  const theme = (site?.theme ?? null) as Theme | null
  const base = themeCss(theme)
  const navy = theme?.primary
  const extra =
    navy && /^#[0-9a-f]{3}([0-9a-f]{3})?$/i.test(navy) ? `:root{--color-navy:${navy};}` : ''
  return `${base}${extra}`
}

export function themeForTests(overrides: Partial<Theme> = {}): Theme {
  return {
    primary: '#192b3a',
    accent: '#c4a574',
    background: '#ffffff',
    foreground: '#171717',
    radius: 'md',
    lineHeight: 1.8,
    ...overrides,
  }
}

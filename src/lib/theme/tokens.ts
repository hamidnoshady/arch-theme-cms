import { themeCss, type Theme } from '@eshobe/site-runtime'

import type { SiteDescriptor } from '@/lib/types'

/** CMS `primary`/`accent` values are reallocated to Graphite's monochrome pair. */
const MONO = { primary: '#000000', accent: '#000000' } as const

/**
 * Graphite renders strictly in black and white, so a tenant's CMS `primary`
 * cannot tint the UI. `themeCss` handles contrast pairing, radius and
 * line-height for the *reallocated* colours, and its `--radius` output is
 * pinned square by the theme stylesheet so geometry stays architectural.
 */
export function siteThemeStyle(site: SiteDescriptor | null): string {
  const theme = (site?.theme ?? null) as Theme | null
  if (!theme) return ''
  return themeCss({
    ...theme,
    primary: MONO.primary,
    accent: MONO.accent,
  })
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

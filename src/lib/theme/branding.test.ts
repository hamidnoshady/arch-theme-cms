import { describe, expect, it } from 'vitest'

import { DEMO_BRANDING, logoMarkFor, resolveBranding } from './branding'

describe('resolveBranding', () => {
  it('uses CMS name instead of Graphite demo labels', () => {
    const branding = resolveBranding(
      {
        availableLocales: ['fa', 'en'],
        blocks: [],
        contractVersion: 1,
        defaultLocale: 'fa',
        domain: 'acme.ir',
        name: 'استودیو آکمه',
        status: 'active',
      },
      'fa',
    )
    expect(branding.siteName).toBe('استودیو آکمه')
    expect(branding.brandLabel).toBe('استودیو آکمه')
    expect(branding.siteName).not.toContain(DEMO_BRANDING.displayNameFa!)
  })

  it('leads the chrome with the primary mark and keeps the home mark for the full variant', () => {
    const primary = { id: 'primary', url: '/api/media/file/mark.svg' }
    const compact = { id: 'compact', url: '/api/media/file/mark-small.svg' }
    const home = { id: 'home', url: '/api/media/file/mark-home.svg' }
    const branding = {
      ...DEMO_BRANDING,
      logo: primary,
      logoCompact: compact,
      homeLogo: home,
      siteName: 'استودیو نقش',
      brandLabel: 'استودیو نقش',
    }

    expect(logoMarkFor(branding, 'compact')).toBe(primary)
    expect(logoMarkFor(branding, 'full')).toBe(home)
    expect(logoMarkFor({ ...branding, logo: null }, 'compact')).toBe(compact)
    expect(logoMarkFor({ ...branding, homeLogo: null }, 'full')).toBe(primary)
    expect(logoMarkFor(null, 'compact')).toBeNull()
  })

  it('prefers explicit branding fields when present', () => {
    const branding = resolveBranding(
      {
        availableLocales: ['fa', 'en'],
        blocks: [],
        contractVersion: 1,
        defaultLocale: 'fa',
        domain: 'acme.ir',
        name: 'Legacy',
        status: 'active',
        branding: { displayName: 'Acme Studio', displayNameFa: 'آکمه' },
      },
      'en',
    )
    expect(branding.siteName).toBe('Acme Studio')
  })
})

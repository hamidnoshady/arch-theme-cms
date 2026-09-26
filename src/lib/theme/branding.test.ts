import { describe, expect, it } from 'vitest'

import { DEMO_BRANDING, resolveBranding } from './branding'

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

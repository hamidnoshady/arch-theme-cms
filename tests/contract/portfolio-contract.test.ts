import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { resolveBranding } from '@/lib/theme/branding'
import { effectiveBindings } from '@/lib/theme/manifest-bindings'
import { bindingRef } from '@/lib/theme/sections'
import { resolveRuntimeSettings } from '@/lib/theme/settings'
import { siteThemeStyle } from '@/lib/theme/tokens'
import { navItemActive } from '@/lib/navigation'
import type { SiteDescriptor } from '@/lib/types'

const fixture = JSON.parse(readFileSync('tests/fixtures/portfolio-site.json', 'utf8')) as {
  site: SiteDescriptor
  header: { navItems: { link?: { label?: string; url?: string } }[] }
}

describe('portfolio fixture contract', () => {
  it('resolves tenant branding without Graphite defaults', () => {
    const branding = resolveBranding(fixture.site, 'en')
    expect(branding.siteName).toBe('Studio Example')
    expect(branding.siteName).not.toMatch(/graphite/i)
  })

  it('merges manifest and site bindings', () => {
    const bindings = effectiveBindings(fixture.site)
    expect(bindingRef(bindings?.aboutPage)).toEqual({
      id: '0a7f1c6e-1111-4a2b-8c3d-000000000001',
      slug: 'درباره-ما',
    })
    // Not bound on the site: the manifest's slug hint fills in.
    expect(bindings?.contactPage).toBe('contact')
  })

  it('applies runtime settings from site descriptor', () => {
    const settings = resolveRuntimeSettings(fixture.site.themeRuntime?.settings)
    expect(settings.introAnimation).toBe(true)
    expect(settings.showSectionNumbers).toBe(true)
  })

  it('emits theme CSS for custom tokens', () => {
    expect(siteThemeStyle(fixture.site)).toContain('--primary:#192b3a')
  })

  it('models CMS header navigation active states', () => {
    expect(navItemActive('/projects', { path: '/projects', exact: true })).toBe('page')
    expect(navItemActive('/about', { path: '/projects/foo', exact: false })).toBeUndefined()
  })

  it('declares portfolio block allowlist including logos and pricing', () => {
    expect(fixture.site.blocks).toEqual(
      expect.arrayContaining(['gallery', 'team', 'contact', 'formBlock', 'logos', 'pricing']),
    )
  })
})

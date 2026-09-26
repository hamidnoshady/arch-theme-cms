import { describe, expect, it } from 'vitest'

import { siteThemeStyle, themeForTests } from './tokens'

describe('siteThemeStyle', () => {
  it('emits CMS tokens and maps primary to Graphite navy', () => {
    const css = siteThemeStyle({
      availableLocales: ['fa'],
      blocks: [],
      contractVersion: 1,
      defaultLocale: 'fa',
      domain: 'x.ir',
      status: 'active',
      theme: themeForTests({ primary: '#112233', background: '#ffffff', foreground: '#111111' }),
    })
    expect(css).toContain('--primary:#112233')
    expect(css).toContain('--color-navy:#112233')
  })

  it('drops malformed colours', () => {
    const css = siteThemeStyle({
      availableLocales: ['fa'],
      blocks: [],
      contractVersion: 1,
      defaultLocale: 'fa',
      domain: 'x.ir',
      status: 'active',
      theme: { primary: 'not-a-color', accent: '#00ff00' },
    })
    expect(css).not.toContain('not-a-color')
    expect(css).toContain('--accent:#00ff00')
  })
})

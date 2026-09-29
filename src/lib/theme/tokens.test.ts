import { describe, expect, it } from 'vitest'

import { siteThemeStyle, themeForTests } from './tokens'

describe('siteThemeStyle', () => {
  it('reallocates CMS primary/accent to the monochrome pair', () => {
    const css = siteThemeStyle({
      availableLocales: ['fa'],
      blocks: [],
      contractVersion: 1,
      defaultLocale: 'fa',
      domain: 'x.ir',
      status: 'active',
      theme: themeForTests({ primary: '#112233', background: '#ffffff', foreground: '#111111' }),
    })
    expect(css).toContain('--primary:#000000')
    expect(css).toContain('--accent:#000000')
    expect(css).not.toContain('#112233')
    expect(css).not.toContain('--color-navy')
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
  })

  it('emits nothing without a theme', () => {
    expect(siteThemeStyle(null)).toBe('')
  })
})

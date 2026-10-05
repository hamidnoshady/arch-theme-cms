import { describe, expect, it } from 'vitest'

import { resolveLink } from './links'
import type { PageRole } from './theme/sections'

const ABOUT = '0a7f1c6e-1111-4a2b-8c3d-000000000001'
const roles = new Map<string, PageRole>([[ABOUT, 'about']])

describe('page links follow section bindings', () => {
  const link = (slug: string) => ({
    type: 'reference' as const,
    reference: { relationTo: 'pages' as const, value: { id: ABOUT, slug } },
  })

  it('sends a page bound to «about» to /about whatever its own slug is', () => {
    expect(resolveLink(link('درباره-ما'), 'fa', roles)?.href).toBe('/about')
    expect(resolveLink(link('team'), 'en', roles)?.href).toBe('/en/about')
  })

  it('keeps ordinary pages on their own slug', () => {
    const other = { type: 'reference' as const, reference: { relationTo: 'pages' as const, value: { id: 'x', slug: 'press' } } }
    expect(resolveLink(other, 'en', roles)?.href).toBe('/en/press')
  })

  it('still applies the legacy section-key rule when no roles are known', () => {
    expect(resolveLink(link('about'), 'fa')?.href).toBe('/about')
    expect(resolveLink(link('team'), 'fa')?.href).toBe('/team')
  })
})

describe('custom menu URLs follow the visitor’s language', () => {
  const custom = (url: string) => ({ type: 'custom' as const, url })

  it('sends an author-typed section path to the English section on English pages', () => {
    expect(resolveLink(custom('/projects'), 'en')?.href).toBe('/en/projects')
    expect(resolveLink(custom('/projects'), 'fa')?.href).toBe('/projects')
    expect(resolveLink(custom('/'), 'en')?.href).toBe('/en')
  })

  it('keeps query and hash, and treats a bare word as a site path', () => {
    expect(resolveLink(custom('/projects?category=public#list'), 'en')?.href).toBe('/en/projects?category=public#list')
    expect(resolveLink(custom('about'), 'en')?.href).toBe('/en/about')
  })

  it('leaves an explicit English path and external links as written', () => {
    expect(resolveLink(custom('/en/contact'), 'en')?.href).toBe('/en/contact')
    expect(resolveLink(custom('https://example.com'), 'en')).toEqual({ href: 'https://example.com', external: true, newTab: false })
    expect(resolveLink(custom('mailto:a@b.co'), 'fa')?.external).toBe(true)
  })

  it('refuses scripts and paths a browser would read as another origin', () => {
    expect(resolveLink(custom('javascript:alert(1)'), 'en')).toBeNull()
    expect(resolveLink(custom('data:text/html,x'), 'en')).toBeNull()
    expect(resolveLink(custom('//evil.com'), 'en')?.external).toBe(true) // protocol-relative is external, never local
    expect(resolveLink(custom('/\\evil.com'), 'en')).toBeNull()
  })
})

describe('safe local paths', () => {
  it('accepts site paths and rejects protocol-relative tricks', async () => {
    const { isSafeLocalPath, localizePath } = await import('./links')
    expect(isSafeLocalPath('/thanks')).toBe(true)
    expect(isSafeLocalPath('//evil.com')).toBe(false)
    expect(isSafeLocalPath('/\\evil.com')).toBe(false)
    expect(isSafeLocalPath('/\t/evil.com')).toBe(false)
    expect(isSafeLocalPath('https://x')).toBe(false)
    expect(localizePath('/en', 'en')).toBe('/en')
  })
})

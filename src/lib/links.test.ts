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

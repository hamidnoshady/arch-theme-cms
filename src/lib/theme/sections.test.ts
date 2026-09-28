import { describe, expect, it } from 'vitest'

import { bindingRef, pageRoleIndex, sectionRef } from './sections'
import type { SiteDescriptor } from '@/lib/types'

const ABOUT = '0a7f1c6e-1111-4a2b-8c3d-000000000001'
const HOME = '0a7f1c6e-1111-4a2b-8c3d-000000000002'

const site = (bindings: Record<string, unknown> | null): SiteDescriptor =>
  ({ themeRuntime: bindings ? { bindings } : null }) as unknown as SiteDescriptor

describe('bindingRef', () => {
  it('reads the resolved object the CMS sends', () => {
    expect(bindingRef({ id: ABOUT, type: 'page', slug: 'درباره-ما', title: 'درباره ما' })).toEqual({
      id: ABOUT,
      slug: 'درباره-ما',
    })
  })

  it('tells a bare id from a bare slug hint', () => {
    expect(bindingRef(ABOUT)).toEqual({ id: ABOUT, slug: null })
    expect(bindingRef('about')).toEqual({ id: null, slug: 'about' })
  })

  it('never trusts a non-uuid id as an id', () => {
    expect(bindingRef({ id: '42', slug: 'about' })).toEqual({ id: null, slug: 'about' })
  })

  it('treats empty and missing values as unbound', () => {
    expect(bindingRef(null)).toEqual({ id: null, slug: null })
    expect(bindingRef('  ')).toEqual({ id: null, slug: null })
    expect(bindingRef({})).toEqual({ id: null, slug: null })
  })
})

describe('sectionRef', () => {
  it('prefers the bound document over the section-key slug hint', () => {
    const ref = sectionRef(site({ aboutPage: { id: ABOUT, slug: 'team' } }), 'about')
    expect(ref).toEqual({ id: ABOUT, slug: 'team' })
  })

  it('falls back to the manifest slug hint when nothing is bound', () => {
    expect(sectionRef(site(null), 'about')).toEqual({ id: null, slug: 'about' })
    expect(sectionRef(null, 'projects')).toEqual({ id: null, slug: 'projects' })
    expect(sectionRef(null, 'home').id).toBeNull()
  })
})

describe('pageRoleIndex', () => {
  it('maps bound page ids to their role and ignores slug-only hints', () => {
    const roles = pageRoleIndex(site({ aboutPage: { id: ABOUT }, homePage: { id: HOME }, contactPage: 'contact' }))
    expect(roles.get(ABOUT)).toBe('about')
    expect(roles.get(HOME)).toBe('home')
    expect(roles.size).toBe(2)
  })
})

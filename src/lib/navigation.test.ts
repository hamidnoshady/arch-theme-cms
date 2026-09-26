import { describe, expect, it } from 'vitest'

import { navItemActive } from './navigation'

describe('navItemActive', () => {
  it('marks the exact index route', () => {
    expect(navItemActive('/projects', { path: '/projects', exact: true })).toBe('page')
    expect(navItemActive('/projects', { path: '/projects/foo', exact: true })).toBeUndefined()
  })

  it('highlights parent section on detail pages', () => {
    expect(navItemActive('/projects', { path: '/projects/foo', exact: false })).toBe('true')
  })
})

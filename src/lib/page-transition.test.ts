import { describe, expect, it } from 'vitest'

import { startsPageChange } from './page-transition'

const HERE = 'https://studio.localhost/projects'

describe('startsPageChange', () => {
  it('follows an internal link to another route', () => {
    expect(startsPageChange({ href: '/about', current: HERE })).toBe(true)
    expect(startsPageChange({ href: '/projects/school-pavilion', current: HERE })).toBe(true)
    expect(startsPageChange({ href: 'https://studio.localhost/about', current: HERE })).toBe(true)
  })

  it('counts a query change as a page change (section index filters)', () => {
    expect(startsPageChange({ href: '/projects?category=commercial', current: HERE })).toBe(true)
  })

  it('ignores presses that stay on the page', () => {
    expect(startsPageChange({ href: '/projects', current: HERE })).toBe(false)
    expect(startsPageChange({ href: '/projects?', current: HERE })).toBe(false)
    expect(startsPageChange({ href: '#content', current: HERE })).toBe(false)
    expect(startsPageChange({ href: '/projects#grid', current: HERE })).toBe(false)
  })

  it('leaves navigation the browser owns to the browser', () => {
    expect(startsPageChange({ href: '/about', current: HERE, modified: true })).toBe(false)
    expect(startsPageChange({ href: '/about', current: HERE, target: '_blank' })).toBe(false)
    expect(startsPageChange({ href: '/brochure.pdf', current: HERE, download: true })).toBe(false)
  })

  it('ignores another origin and anything unresolvable', () => {
    expect(startsPageChange({ href: 'https://example.com/about', current: HERE })).toBe(false)
    expect(startsPageChange({ href: 'mailto:studio@example.com', current: HERE })).toBe(false)
    expect(startsPageChange({ href: 'tel:+9812345678', current: HERE })).toBe(false)
    expect(startsPageChange({ href: 'about', current: 'not a url' })).toBe(false)
  })
})

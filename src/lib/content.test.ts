import { describe, expect, it } from 'vitest'

import { extractFacts } from '@/components/content/RichText'
import { referenceHref, safeHref } from './links'
import { findContactBlock, findLocation } from './office'
import { richTextToPlain } from './richtext'
import type { Page, RichTextData } from './types'

const text = (value: string) => ({ type: 'text', text: value, version: 1 })

const list = (items: string[]): RichTextData => ({
  root: {
    type: 'root',
    children: [
      {
        type: 'list',
        listType: 'bullet',
        children: items.map((item) => ({ type: 'listitem', children: [text(item)] })),
      },
      { type: 'paragraph', children: [text('The building sits on the ridge.')] },
    ],
  },
})

describe('project facts', () => {
  it('lifts a label:value list out of the body and leaves the prose', () => {
    const { facts, body } = extractFacts(list(['مکان: دماوند', 'سال: ۱۴۰۲']))
    expect(facts).toEqual([
      { label: 'مکان', value: 'دماوند' },
      { label: 'سال', value: '۱۴۰۲' },
    ])
    expect(richTextToPlain(body)).toBe('The building sits on the ridge.')
  })

  it('leaves an ordinary list in the body', () => {
    const data = list(['a note without a label'])
    expect(extractFacts(data).facts).toEqual([])
  })
})

describe('links', () => {
  it('routes a post reference through the posts redirect and keeps the locale', () => {
    expect(referenceHref({ relationTo: 'posts', value: { id: '1', slug: 'خانه-سنگی' } }, 'fa')).toBe(
      '/posts/%D8%AE%D8%A7%D9%86%D9%87-%D8%B3%D9%86%DA%AF%DB%8C',
    )
    expect(referenceHref({ relationTo: 'pages', value: { id: '2', slug: 'about' } }, 'en')).toBe('/en/about')
    expect(referenceHref({ relationTo: 'pages', value: { id: '3', slug: 'home' } }, 'en')).toBe('/en')
  })

  it('allows web, mail and site paths, and drops script urls', () => {
    expect(safeHref('https://www.openstreetmap.org/?mlat=1&mlon=2')).toMatch(/^https:/)
    expect(safeHref('/projects')).toBe('/projects')
    expect(safeHref('mailto:studio@example.com')).toMatch(/^mailto:/)
    expect(safeHref('javascript:alert(1)')).toBeNull()
  })
})

describe('office location', () => {
  const page = (url: string): Page =>
    ({
      id: 'p',
      title: 'تماس',
      slug: 'contact',
      layout: [
        {
          blockType: 'contact',
          address: 'تهران',
          phones: ['02100000000'],
        },
        {
          blockType: 'content',
          columns: [{ richText: { root: { type: 'root', children: [{ type: 'link', fields: { url }, children: [text('map')] }] } } }],
        },
      ],
    }) as Page

  it('uses a map link that carries coordinates and ignores one that does not', () => {
    expect(findLocation([page('https://www.openstreetmap.org/?mlat=35.7&mlon=51.4')])?.lat).toBeCloseTo(35.7)
    expect(findLocation([page('https://www.google.com/maps/search/Tehran')])).toBeNull()
    expect(findContactBlock([page('https://example.com')])?.address).toBe('تهران')
  })
})

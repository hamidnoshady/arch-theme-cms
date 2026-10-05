import { describe, expect, it } from 'vitest'

import { factYear, projectCardLine, projectFactsAndBody, structuredFacts } from './project-metadata'
import type { LexicalNode, Post, RichTextData } from './types'

const text = (t: string): LexicalNode => ({ type: 'text', text: t })
const para = (t: string): LexicalNode => ({ type: 'paragraph', children: [text(t)] })
const bullets = (items: string[]): LexicalNode => ({
  type: 'list',
  listType: 'bullet',
  children: items.map((t) => ({ type: 'listitem', children: [text(t)] })),
})
const doc = (...children: LexicalNode[]): RichTextData => ({ root: { type: 'root', children } })

const post = (extra: Partial<Post>): Post => ({ id: '1', title: 'Sea House', ...extra })

describe('project facts: the CMS `projectMetadata` contract', () => {
  it('reads the structured group the CMS sends, in display order, year only', () => {
    const facts = structuredFacts(
      {
        location: ' Nowshahr ',
        date: '2023-05-01T00:00:00.000Z',
        area: '320 m²',
        status: '',
        client: null,
        additionalFacts: [
          { label: 'Structure', value: 'Exposed concrete' },
          { label: 'Empty', value: '  ' },
        ],
      },
      'en',
    )
    expect(facts).toEqual([
      { label: 'Location', value: 'Nowshahr' },
      { label: 'Year', value: '2023' },
      { label: 'Area', value: '320 m²' },
      { label: 'Structure', value: 'Exposed concrete' },
    ])
  })

  it('shows the year in the Jalali calendar with Persian digits on fa', () => {
    expect(factYear('2023-05-01T00:00:00.000Z', 'fa')).toBe('۱۴۰۲')
    expect(factYear('not a date', 'fa')).toBe('')
    expect(factYear(null, 'en')).toBe('')
  })

  it('invents nothing for an empty or missing group', () => {
    expect(structuredFacts(null, 'en')).toEqual([])
    expect(structuredFacts({}, 'en')).toEqual([])
  })

  it('ignores field names the CMS never sends', () => {
    const legacyShape = { ...post({ content: doc(para('Body')) }), portfolio: { location: 'Tehran' } } as Post
    expect(projectFactsAndBody(legacyShape, 'en')).toMatchObject({ facts: [], source: 'none' })
  })
})

describe('project facts: legacy bullet-list compatibility', () => {
  const legacyBody = doc(bullets(['Location: Tabriz', 'Year: 2020']), para('Restoration of a bazaar row.'))

  it('reads the first Label: Value list when there is no structured metadata', () => {
    const { facts, body, source } = projectFactsAndBody(post({ content: legacyBody }), 'en')
    expect(source).toBe('legacy')
    expect(facts).toEqual([
      { label: 'Location', value: 'Tabriz' },
      { label: 'Year', value: '2020' },
    ])
    expect(body?.root.children).toHaveLength(1)
  })

  it('prefers structured metadata and never renders the legacy list a second time', () => {
    const { facts, body, source } = projectFactsAndBody(
      post({ content: legacyBody, projectMetadata: { location: 'Tabriz', date: '2020-03-01T00:00:00.000Z' } }),
      'en',
    )
    expect(source).toBe('structured')
    expect(facts).toEqual([
      { label: 'Location', value: 'Tabriz' },
      { label: 'Year', value: '2020' },
    ])
    expect(body?.root.children?.map((n) => n.type)).toEqual(['paragraph'])
  })

  it('leaves an ordinary list in the body', () => {
    const content = doc(bullets(['Daylight first', 'Local materials']), para('Text'))
    expect(projectFactsAndBody(post({ content }), 'en')).toMatchObject({ facts: [], body: content, source: 'none' })
  })
})

describe('project card line', () => {
  it('joins location and year with the locale separator, and is empty without data', () => {
    const meta = { location: 'Nowshahr', date: '2023-05-01T00:00:00.000Z' }
    expect(projectCardLine({ projectMetadata: meta }, 'en')).toBe('Nowshahr · 2023')
    expect(projectCardLine({ projectMetadata: meta }, 'fa')).toBe('Nowshahr، ۱۴۰۲')
    expect(projectCardLine({ projectMetadata: null }, 'en')).toBe('')
  })
})

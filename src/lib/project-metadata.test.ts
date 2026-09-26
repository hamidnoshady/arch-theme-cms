import { describe, expect, it } from 'vitest'

import { projectFactsAndBody } from './project-metadata'
import type { Post } from './types'

describe('projectFactsAndBody', () => {
  it('prefers structured portfolio metadata', () => {
    const post = {
      id: '1',
      title: 'Tower',
      content: { root: { type: 'root', children: [{ type: 'paragraph', children: [{ type: 'text', text: 'Body' }] }] } },
      portfolio: { location: 'Tehran', year: '1402' },
    } as Post & { portfolio: { location: string; year: string } }
    const { facts, body } = projectFactsAndBody(post, 'en')
    expect(facts).toEqual([{ label: 'Location', value: 'Tehran' }, { label: 'Year', value: '1402' }])
    expect(body).toBe(post.content)
  })
})

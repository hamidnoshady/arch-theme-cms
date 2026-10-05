import { describe, expect, it } from 'vitest'

import { moreEntries } from './continuation'
import type { Post } from './types'

const p = (id: string, relatedPosts: Post['relatedPosts'] = []): Post => ({ id, title: id, slug: id, relatedPosts })

describe('continuation after an entry', () => {
  const siblings = [p('a'), p('b'), p('c'), p('d')]

  it('uses the editor’s related posts that exist in this section and language', () => {
    const post = p('a', ['c', { id: 'gone' } as Post, 'a', 'd'])
    expect(moreEntries(post, siblings)).toEqual({ items: [siblings[2], siblings[3]], related: true })
  })

  it('falls back to the following entries, wrapping, never the entry itself', () => {
    expect(moreEntries(p('c'), siblings).items.map((x) => x.id)).toEqual(['d', 'a', 'b'])
    expect(moreEntries(p('a'), [p('a')]).items).toEqual([])
  })
})

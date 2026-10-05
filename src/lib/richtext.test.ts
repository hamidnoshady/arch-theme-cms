import { describe, expect, it } from 'vitest'

import { headingAnchors, mediaKey, splitBodyImages, withoutLeadingTitle, withoutMedia } from './richtext'
import type { LexicalNode, Media, RichTextData } from './types'

const text = (t: string): LexicalNode => ({ type: 'text', text: t })
const para = (t: string): LexicalNode => ({ type: 'paragraph', children: t ? [text(t)] : [] })
const heading = (t: string, tag = 'h2'): LexicalNode => ({ type: 'heading', tag, children: t ? [text(t)] : [] })
const media = (id: string, mimeType = 'image/jpeg'): Media => ({ id, url: `/api/media/file/${id}.jpg`, mimeType })
const upload = (m: Media): LexicalNode => ({ type: 'upload', relationTo: 'media', value: m })
const doc = (...children: LexicalNode[]): RichTextData => ({ root: { type: 'root', children } })

describe('page lead', () => {
  it('drops a leading heading that only repeats the page title', () => {
    const lead = withoutLeadingTitle(doc(heading('About', 'h1'), para('We are a studio.')), ' about ')
    expect(lead?.root.children?.map((n) => n.type)).toEqual(['paragraph'])
  })

  it('keeps a heading that says something else', () => {
    const data = doc(heading('Our approach', 'h1'), para('x'))
    expect(withoutLeadingTitle(data, 'About')).toBe(data)
  })
})

describe('section anchors', () => {
  it('marks each non-empty top-level h2 (or demoted h1) in order, skipping empty headings and h3s', () => {
    const anchors = headingAnchors(doc(heading('Site'), heading(''), heading('Detail', 'h3'), heading('Materials', 'h1'), heading('Build')))
    expect(anchors).toEqual([
      { id: 'section-1', text: 'Site' },
      { id: 'section-2', text: 'Materials' },
      { id: 'section-3', text: 'Build' },
    ])
  })

  it('has none for a body without headings', () => {
    expect(headingAnchors(doc(para('only text')))).toEqual([])
    expect(headingAnchors(null)).toEqual([])
  })
})

describe('project imagery', () => {
  const hero = media('hero')
  const a = media('a')
  const b = media('b')
  const film = media('film', 'video/mp4')

  it('lifts each image out once, never the hero, and leaves text and video in place', () => {
    const { body, images } = splitBodyImages(
      doc(para('intro'), upload(hero), upload(a), para('more'), upload(a), upload(film), upload(b)),
      [mediaKey(hero)],
    )
    expect(images.map((m) => m.id)).toEqual(['a', 'b'])
    expect(body?.root.children?.map((n) => n.type)).toEqual(['paragraph', 'paragraph', 'upload'])
  })

  it('also reads inline media blocks', () => {
    const block: LexicalNode = { type: 'block', fields: { blockType: 'mediaBlock', media: a } }
    expect(splitBodyImages(doc(block)).images.map((m) => m.id)).toEqual(['a'])
  })

  it('removes only the repeated hero from an article body', () => {
    const body = withoutMedia(doc(upload(hero), para('x'), upload(a)), [mediaKey(hero)])
    expect(body?.root.children?.map((n) => (n.type === 'upload' ? (n.value as Media).id : n.type))).toEqual(['paragraph', 'a'])
  })

  it('identifies media by id, else by URL without query', () => {
    expect(mediaKey({ id: '', url: '/api/media/file/x.jpg?2024' })).toBe('/api/media/file/x.jpg')
    expect(mediaKey(null)).toBe('')
  })
})

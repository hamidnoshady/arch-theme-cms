import { describe, expect, it } from 'vitest'

import { absoluteMediaUrl, isVideoMime, mediaOrigin, resolveMedia } from './media'
import type { SiteDescriptor } from './types'

describe('media urls', () => {
  it('resolves relative CMS paths against the origin and leaves absolute urls', () => {
    expect(absoluteMediaUrl('/api/media/file/a.jpg', 'https://acme.ir')).toBe('https://acme.ir/api/media/file/a.jpg')
    expect(absoluteMediaUrl('https://cdn.example/a.jpg', 'https://acme.ir')).toBe('https://cdn.example/a.jpg')
    expect(absoluteMediaUrl(undefined, 'https://acme.ir')).toBe('')
  })

  it('serves own-domain media relatively, whatever port or protocol the CMS reports', () => {
    const site = (origin: string) => ({ domain: 'arch.eshobe.com', media: { origin } }) as SiteDescriptor
    expect(mediaOrigin(site('https://arch.eshobe.com:3000'))).toBe('')
    expect(mediaOrigin(site('https://cdn.eshobe.com/'))).toBe('https://cdn.eshobe.com')
    expect(mediaOrigin(null)).toBe('')
  })

  it('builds a srcset from the smaller generated sizes', () => {
    const media = resolveMedia(
      {
        id: '1',
        url: '/api/media/file/plan.jpg',
        alt: 'پلان',
        width: 2000,
        height: 1200,
        mimeType: 'image/jpeg',
        sizes: { medium: { url: '/api/media/file/plan-900.jpg', width: 900, height: 540 } },
      },
      'https://acme.ir',
    )
    expect(media?.src).toBe('https://acme.ir/api/media/file/plan.jpg')
    expect(media?.srcSet).toContain('900w')
    expect(media?.srcSet).toContain('2000w')
    expect(media?.alt).toBe('پلان')
  })

  it('treats a video url as video even without a mime type', () => {
    expect(isVideoMime(null, 'https://files.example/tour.mp4')).toBe(true)
    expect(isVideoMime('image/jpeg', '/a.jpg')).toBe(false)
  })
})

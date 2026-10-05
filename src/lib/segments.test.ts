import { describe, expect, it } from 'vitest'

import { decodeSegment } from './segments'

describe('route segments', () => {
  it('decodes Persian slugs to NFC', () => {
    expect(decodeSegment(encodeURIComponent('خانه-ساحلی'))).toBe('خانه-ساحلی')
  })

  it('rejects malformed slugs before any CMS query', () => {
    expect(decodeSegment('%E0%A4')).toBeNull() // broken escape
    expect(decodeSegment('%2F..%2Fapi')).toBeNull() // encoded separator
    expect(decodeSegment('..')).toBeNull()
    expect(decodeSegment('a%00b')).toBeNull()
    expect(decodeSegment('x'.repeat(201))).toBeNull()
    expect(decodeSegment('')).toBeNull()
  })

  it('accepts ordinary slugs, including the string "undefined" (which simply does not exist)', () => {
    expect(decodeSegment('sea-house')).toBe('sea-house')
    expect(decodeSegment('undefined')).toBe('undefined')
  })
})

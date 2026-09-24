import { createHmac } from 'node:crypto'
import { afterEach, describe, expect, it } from 'vitest'
import { toThemePath, verifyRevalidateSignature } from './revalidate'

afterEach(() => {
  delete process.env.ESHOBE_REVALIDATE_SECRET
  delete process.env.ESHOBE_SITE_DOMAIN
})

describe('revalidate helpers', () => {
  it('strips the CMS domain prefix from paths', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    expect(toThemePath('/acme.ir/en/about')).toBe('/en/about')
    expect(toThemePath('/acme.ir/about')).toBe('/about')
    expect(toThemePath('/acme.ir')).toBe('/')
  })

  it('collapses /posts paths to layout root for this theme', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    expect(toThemePath('/acme.ir/en/posts/foo')).toBe('/')
  })

  it('verifies HMAC over the raw body', () => {
    process.env.ESHOBE_REVALIDATE_SECRET = 's3cret'
    const body = JSON.stringify({ paths: ['/acme.ir/'], siteId: '1', timestamp: 't' })
    const sig = `sha256=${createHmac('sha256', 's3cret').update(body).digest('hex')}`
    expect(verifyRevalidateSignature(body, sig)).toBe(true)
    expect(verifyRevalidateSignature(body, 'sha256=deadbeef')).toBe(false)
    expect(verifyRevalidateSignature(body, null)).toBe(false)
  })
})

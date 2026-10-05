import { afterEach, describe, expect, it } from 'vitest'

import { isKeyedPath, proxyHeaders } from './cms-proxy'

afterEach(() => {
  delete process.env.ESHOBE_SITE_DOMAIN
  delete process.env.ESHOBE_API_KEY
})

describe('cms proxy headers', () => {
  it('keeps the CMS Host and sends no key on an anonymous path when a key is configured', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    process.env.ESHOBE_API_KEY = 'eshobe_live_secret'
    const headers = proxyHeaders(new Headers({ 'content-type': 'application/json', cookie: 'a=b' }), 'preview.example')
    expect(headers.host).toBeUndefined()
    expect(headers['x-forwarded-host']).toBeUndefined()
    expect(JSON.stringify(headers)).not.toContain('eshobe_live_secret')
    expect(headers.cookie).toBeUndefined()
    expect(headers.authorization).toBeUndefined()
  })

  it('attaches the key only to keyed requests, replacing any visitor credential', () => {
    process.env.ESHOBE_API_KEY = 'eshobe_live_secret'
    const headers = proxyHeaders(new Headers({ authorization: 'Bearer visitor' }), 'acme.ir', { keyed: true })
    expect(headers.authorization).toBe('Bearer eshobe_live_secret')
  })

  it('sends the customer host as the tenant when there is no key', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    const headers = proxyHeaders(new Headers(), 'preview.example')
    expect(headers.host).toBe('acme.ir')
    expect(headers['x-forwarded-host']).toBe('acme.ir')
  })
})

describe('keyed proxy paths', () => {
  it('covers the site descriptor and media files, read-only', () => {
    expect(isKeyedPath('GET', 'site')).toBe(true)
    expect(isKeyedPath('HEAD', 'media/file/sea-house.jpg')).toBe(true)
    expect(isKeyedPath('POST', 'site')).toBe(false)
    expect(isKeyedPath('GET', 'pages')).toBe(false)
    expect(isKeyedPath('GET', 'media/file/../pages')).toBe(false)
    expect(isKeyedPath('GET', 'form-submissions')).toBe(false)
  })
})

describe('public /api allowlist', async () => {
  const { publicApiPath } = await import('./cms-proxy')

  it('serves only the site descriptor and media files, read-only', () => {
    expect(publicApiPath('GET', ['site'])).toBe('site')
    expect(publicApiPath('HEAD', ['media', 'file', 'sea house.jpg'])).toBe('media/file/sea%20house.jpg')
    expect(publicApiPath('POST', ['site'])).toBeNull()
    expect(publicApiPath('GET', ['pages'])).toBeNull()
    expect(publicApiPath('GET', ['users', 'me'])).toBeNull()
    expect(publicApiPath('POST', ['users', 'login'])).toBeNull()
    expect(publicApiPath('GET', ['form-submissions'])).toBeNull()
  })

  it('cannot be walked out of /api', () => {
    expect(publicApiPath('GET', ['media', 'file', '..'])).toBeNull()
    expect(publicApiPath('GET', ['media', 'file', '../../admin'])).toBeNull()
    expect(publicApiPath('GET', ['media', 'file', '..\\admin'])).toBeNull()
    expect(publicApiPath('GET', ['media', '..', 'pages'])).toBeNull()
    expect(publicApiPath('GET', ['media', 'file', 'a', 'b'])).toBeNull()
  })
})

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

describe('proxyToCms', () => {
  it('blocks path traversal attacks (SSRF)', async () => {
    const { proxyToCms } = await import('./cms-proxy')
    process.env.ESHOBE_CMS_URL = 'https://cms.example.com'
    const req = new Request('http://localhost:3000/api/some/path')

    const res = await proxyToCms(req, '../admin')
    expect(res.status).toBe(403)

    const res2 = await proxyToCms(req, '%2e%2e/admin')
    expect(res2.status).toBe(403)

    const res3 = await proxyToCms(req, 'foo/../../admin')
    expect(res3.status).toBe(403)
  })
})

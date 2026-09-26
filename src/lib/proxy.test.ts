import { describe, expect, it } from 'vitest'

import { proxyHeaders } from './cms-proxy'

describe('cms proxy headers', () => {
  it('sends the customer host and never the site API key', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    process.env.ESHOBE_API_KEY = 'eshobe_live_secret'
    const headers = proxyHeaders(new Headers({ 'content-type': 'application/json', cookie: 'a=b' }), 'preview.example')
    expect(headers.host).toBe('acme.ir')
    expect(headers['x-forwarded-host']).toBe('acme.ir')
    expect(JSON.stringify(headers)).not.toContain('eshobe_live_secret')
    expect(headers.cookie).toBeUndefined()
    expect(headers.authorization).toBeUndefined()
    delete process.env.ESHOBE_SITE_DOMAIN
    delete process.env.ESHOBE_API_KEY
  })
})
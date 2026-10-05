import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const cmsJson = vi.fn()
vi.mock('./upstream', () => ({ cmsJson: (...args: unknown[]) => cmsJson(...args) }))

const { CmsUnavailableError, cmsGet, getEntries, getForm, getNav, getPageById, getPostBySlug, invalidateCmsCache } = await import('./cms')

beforeEach(() => {
  cmsJson.mockReset()
  invalidateCmsCache()
})

afterEach(() => {
  delete process.env.ESHOBE_SITE_ID
  delete process.env.ESHOBE_CMS_URL
  vi.useRealTimers()
})

describe('cms reads', () => {
  it('narrows every list to this deployment’s site', async () => {
    process.env.ESHOBE_SITE_ID = '7a0c6f1e-2b3d-4c5e-8f90-a1b2c3d4e5f6'
    cmsJson.mockResolvedValue({ status: 200, data: { docs: [{ id: 'h', navItems: [] }] } })
    await getNav('header', 'fa')
    const [path, search] = cmsJson.mock.calls[0] as [string, string]
    expect(path).toBe('header')
    expect(new URLSearchParams(search).get('where[site][equals]')).toBe(process.env.ESHOBE_SITE_ID)
  })

  it('does not render a draft read by id with the site key', async () => {
    cmsJson.mockResolvedValue({ status: 200, data: { id: 'p', slug: 'about', title: 'About', _status: 'draft' } })
    expect(await getPageById('p', 'en')).toBeNull()
  })

  it('shares one request between concurrent renders', async () => {
    let release!: (v: unknown) => void
    cmsJson.mockReturnValue(new Promise((r) => (release = r)))
    const a = cmsGet('site')
    const b = cmsGet('site')
    release({ status: 200, data: { ok: 1 } })
    expect(await a).toEqual(await b)
    expect(cmsJson).toHaveBeenCalledTimes(1)
  })

  it('keeps serving the last good answer while the CMS is unreachable', async () => {
    vi.useFakeTimers()
    cmsJson.mockResolvedValueOnce({ status: 200, data: { name: 'Acme' } })
    expect(await cmsGet('site')).toEqual({ ok: true, data: { name: 'Acme' } })
    vi.advanceTimersByTime(61_000)
    cmsJson.mockResolvedValueOnce({ status: 0, data: null })
    expect(await cmsGet('site')).toEqual({ ok: true, data: { name: 'Acme' } })
  })

  it('does not keep stale content once the CMS says it is gone', async () => {
    vi.useFakeTimers()
    cmsJson.mockResolvedValueOnce({ status: 200, data: { name: 'Acme' } })
    await cmsGet('pages/x')
    vi.advanceTimersByTime(61_000)
    cmsJson.mockResolvedValueOnce({ status: 404, data: null })
    expect(await cmsGet('pages/x')).toEqual({ ok: false, status: 404 })
  })
})

describe('content states: missing is not the same as unavailable', () => {
  it('reports an outage as an error, never as "nothing published"', async () => {
    process.env.ESHOBE_CMS_URL = 'https://cms.example'
    cmsJson.mockResolvedValue({ status: 503, data: null })
    await expect(getPageById('p', 'en')).rejects.toBeInstanceOf(CmsUnavailableError)
    await expect(getEntries('projects', 'en')).rejects.toBeInstanceOf(CmsUnavailableError)
  })

  it('treats a network failure and a rate limit as outages too', async () => {
    process.env.ESHOBE_CMS_URL = 'https://cms.example'
    cmsJson.mockResolvedValueOnce({ status: 0, data: null })
    await expect(getPageById('a', 'fa')).rejects.toBeInstanceOf(CmsUnavailableError)
    cmsJson.mockResolvedValueOnce({ status: 429, data: null })
    await expect(getPageById('b', 'fa')).rejects.toBeInstanceOf(CmsUnavailableError)
  })

  it('reports a 404 as missing content', async () => {
    process.env.ESHOBE_CMS_URL = 'https://cms.example'
    cmsJson.mockResolvedValue({ status: 404, data: null })
    expect(await getPageById('gone', 'en')).toBeNull()
  })

  it('never throws when no CMS is configured (local development)', async () => {
    cmsJson.mockResolvedValue({ status: 0, data: null })
    expect(await getPageById('p', 'en')).toBeNull()
    expect(await getEntries('projects', 'en')).toEqual([])
  })

  it('reports an untranslated page as missing, not as the other language', async () => {
    cmsJson.mockResolvedValue({ status: 200, data: { id: 'p', slug: null, title: null, _status: 'published' } })
    expect(await getPageById('p', 'en')).toBeNull()
  })

  it('keeps chrome alive through an outage: no menu instead of an error', async () => {
    process.env.ESHOBE_CMS_URL = 'https://cms.example'
    cmsJson.mockResolvedValue({ status: 502, data: null })
    expect(await getNav('header', 'en')).toBeNull()
  })
})

describe('visitor reads are published-only and localized without fallback', () => {
  const params = () => new URLSearchParams((cmsJson.mock.calls.at(-1) as [string, string])[1])

  it('reads menus without locale fallback, so untranslated items drop out', async () => {
    cmsJson.mockResolvedValue({ status: 200, data: { docs: [] } })
    await getNav('header', 'en')
    expect(params().get('fallbackLocale')).toBe('false')
    expect(params().get('locale')).toBe('en')
  })

  it('asks for published posts only', async () => {
    cmsJson.mockResolvedValue({ status: 200, data: { docs: [] } })
    await getPostBySlug('sea-house', 'en')
    expect(params().get('where[_status][equals]')).toBe('published')
    expect(params().get('fallbackLocale')).toBe('false')
  })

  it('does not render a published-looking post whose English title is missing', async () => {
    cmsJson.mockResolvedValue({ status: 200, data: { docs: [{ id: 'x', slug: 'x', title: null }] } })
    expect(await getPostBySlug('x', 'en')).toBeNull()
  })

  it('finds a form only through this site’s key: a foreign form id reads as missing', async () => {
    process.env.ESHOBE_CMS_URL = 'https://cms.example'
    cmsJson.mockResolvedValue({ status: 404, data: null })
    expect(await getForm('0a7f1c6e-2222-4a2b-8c3d-000000000020', 'fa')).toBeNull()
  })
})

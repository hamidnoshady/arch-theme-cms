import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const cmsJson = vi.fn()
vi.mock('./upstream', () => ({ cmsJson: (...args: unknown[]) => cmsJson(...args) }))

const { cmsGet, getNav, getPageById, invalidateCmsCache } = await import('./cms')

beforeEach(() => {
  cmsJson.mockReset()
  invalidateCmsCache()
})

afterEach(() => {
  delete process.env.ESHOBE_SITE_ID
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

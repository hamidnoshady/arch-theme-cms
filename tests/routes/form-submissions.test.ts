import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const getForm = vi.fn()
const upstreamRequest = vi.fn()

vi.mock('@/lib/cms', async () => {
  class CmsUnavailableError extends Error {}
  return { CmsUnavailableError, getForm: (...a: unknown[]) => getForm(...a) }
})
vi.mock('@/lib/upstream', () => ({ upstreamRequest: (...a: unknown[]) => upstreamRequest(...a) }))

const { POST } = await import('@/app/api/form-submissions/route')
const { CmsUnavailableError } = (await import('@/lib/cms')) as unknown as { CmsUnavailableError: new () => Error }

const FORM = '0a7f1c6e-2222-4a2b-8c3d-000000000020'
const form = {
  id: FORM,
  fields: [
    { blockType: 'text', name: 'name', required: true },
    { blockType: 'email', name: 'email', required: true },
  ],
}
const valid = [
  { field: 'name', value: 'Sara' },
  { field: 'email', value: 'sara@example.com' },
]

const post = (body: unknown, headers: Record<string, string> = {}) =>
  POST(
    new Request('https://arch.local/api/form-submissions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', cookie: 'payload-token=staff', 'x-forwarded-for': '203.0.113.9', ...headers },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }),
  )

beforeEach(() => {
  process.env.ESHOBE_CMS_URL = 'https://cms.example'
  process.env.ESHOBE_API_KEY = 'eshobe_live_secret'
  getForm.mockReset()
  upstreamRequest.mockReset()
  upstreamRequest.mockResolvedValue({ status: 201, headers: {}, body: Buffer.from('{}') })
})

afterEach(() => {
  delete process.env.ESHOBE_CMS_URL
  delete process.env.ESHOBE_API_KEY
})

describe('POST /api/form-submissions', () => {
  it('forwards a valid submission anonymously, with the visitor address and nothing else', async () => {
    getForm.mockResolvedValue(form)
    const res = await post({ form: FORM, submissionData: valid })
    expect(res.status).toBe(201)
    const [url, init] = upstreamRequest.mock.calls[0] as [URL, { headers: Record<string, string>; body: Buffer }]
    expect(url.toString()).toBe('https://cms.example/api/form-submissions')
    expect(init.headers.authorization).toBeUndefined()
    expect(init.headers.cookie).toBeUndefined()
    expect(JSON.stringify(init.headers)).not.toContain('eshobe_live_secret')
    expect(init.headers['x-forwarded-for']).toBe('203.0.113.9')
    expect(JSON.parse(init.body.toString())).toEqual({ form: FORM, submissionData: valid })
  })

  it('treats a form id from another site as unknown and forwards nothing', async () => {
    getForm.mockResolvedValue(null) // the site key cannot read another tenant's form
    const res = await post({ form: FORM, submissionData: valid })
    expect(res.status).toBe(404)
    expect(upstreamRequest).not.toHaveBeenCalled()
  })

  it('answers field errors for a crafted request that skips required fields', async () => {
    getForm.mockResolvedValue(form)
    const res = await post({ form: FORM, submissionData: [{ field: 'name', value: 'x' }] })
    expect(res.status).toBe(422)
    expect(await res.json()).toMatchObject({ fields: { email: 'required' } })
    expect(upstreamRequest).not.toHaveBeenCalled()
  })

  it('refuses bodies that are not a small JSON submission', async () => {
    expect((await post('not json')).status).toBe(400)
    expect((await post({ form: 'not-a-uuid', submissionData: valid })).status).toBe(400)
    expect((await post({ form: FORM, submissionData: valid }, { 'content-type': 'text/plain' })).status).toBe(415)
    expect((await post({ form: FORM, submissionData: [{ field: 'name', value: 'x'.repeat(70_000) }] })).status).toBe(413)
    expect(getForm).not.toHaveBeenCalled()
  })

  it('quietly accepts a filled honeypot without forwarding it', async () => {
    const res = await post({ form: FORM, submissionData: [...valid, { field: 'company', value: 'spam inc' }] })
    expect(res.status).toBe(201)
    expect(getForm).not.toHaveBeenCalled()
    expect(upstreamRequest).not.toHaveBeenCalled()
  })

  it('reports a CMS outage or rejection instead of pretending to succeed', async () => {
    getForm.mockRejectedValueOnce(new CmsUnavailableError())
    expect((await post({ form: FORM, submissionData: valid })).status).toBe(503)

    getForm.mockResolvedValue(form)
    upstreamRequest.mockResolvedValueOnce({ status: 500, headers: {}, body: Buffer.from('') })
    expect((await post({ form: FORM, submissionData: valid })).status).toBe(502)
    upstreamRequest.mockResolvedValueOnce({ status: 429, headers: {}, body: Buffer.from('') })
    expect((await post({ form: FORM, submissionData: valid })).status).toBe(429)
    upstreamRequest.mockRejectedValueOnce(new Error('ECONNREFUSED'))
    expect((await post({ form: FORM, submissionData: valid })).status).toBe(502)
  })
})

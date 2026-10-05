import { CmsUnavailableError, getForm } from '@/lib/cms'
import { cmsOrigin } from '@/lib/env'
import { checkSubmission } from '@/lib/forms'
import { upstreamRequest } from '@/lib/upstream'

/** A contact message, not an upload: anything bigger is refused before it is parsed. */
const MAX_BODY = 64 * 1024
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
/** The theme's own off-screen trap field (CmsForm). A filled trap gets a quiet success. */
const HONEYPOT = 'company'

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(body, { status, headers: { 'cache-control': 'no-store' } })

/**
 * Visitor form submissions.
 *
 * The browser's checks are a courtesy; these are the ones that count. The form is read
 * with this deployment's site key, so an id that belongs to another site (or to no site)
 * is unknown here. The submission is validated against that form's own field definitions
 * — required fields, types, lengths, no undeclared fields — and only then forwarded,
 * anonymously: no site key and no visitor cookie ever reach the CMS on this path, and the
 * CMS derives the tenant from the form, never from the request.
 */
export async function POST(req: Request): Promise<Response> {
  if (!cmsOrigin()) return json(503, { error: 'cms-not-configured' })
  if (!(req.headers.get('content-type') ?? '').toLowerCase().includes('application/json')) {
    return json(415, { error: 'unsupported-media-type' })
  }
  const declared = Number(req.headers.get('content-length') ?? 0)
  if (declared > MAX_BODY) return json(413, { error: 'too-large' })
  const raw = await req.text()
  if (Buffer.byteLength(raw) > MAX_BODY) return json(413, { error: 'too-large' })

  let body: unknown
  try {
    body = JSON.parse(raw)
  } catch {
    return json(400, { error: 'invalid-json' })
  }
  const { form: formId, submissionData } = (body ?? {}) as { form?: unknown; submissionData?: unknown }
  if (typeof formId !== 'string' || !UUID.test(formId)) return json(400, { error: 'invalid-form' })

  // A trap filled in is a bot: answer like a success, forward nothing.
  if (Array.isArray(submissionData) && submissionData.some((e) => e?.field === HONEYPOT && String(e?.value ?? '').trim())) {
    return json(201, { ok: true })
  }

  let form
  try {
    form = await getForm(formId, 'fa')
  } catch (error) {
    if (error instanceof CmsUnavailableError) return json(503, { error: 'cms-unavailable' })
    throw error
  }
  if (!form) return json(404, { error: 'form-not-found' })

  const clean = Array.isArray(submissionData) ? submissionData.filter((e) => e?.field !== HONEYPOT) : submissionData
  const check = checkSubmission(form, { submissionData: clean })
  if (!check.ok) return json(check.status, { error: check.error, ...(check.fields ? { fields: check.fields } : {}) })

  const payload = Buffer.from(JSON.stringify(check.submission))
  // The CMS budgets anonymous submissions per client; without the visitor's address every
  // visitor would share this server's one bucket. Only the address travels — no cookie, no key.
  const client: Record<string, string> = {}
  for (const name of ['x-forwarded-for', 'x-real-ip']) {
    const value = req.headers.get(name)
    if (value) client[name] = value
  }
  try {
    const res = await upstreamRequest(new URL(`${cmsOrigin()}/api/form-submissions`), {
      method: 'POST',
      headers: { ...client, 'content-type': 'application/json', accept: 'application/json', 'content-length': String(payload.length) },
      body: payload,
      timeout: 15_000,
    })
    if (res.status === 429) return json(429, { error: 'rate-limited' })
    if (res.status >= 200 && res.status < 300) return json(201, { ok: true })
    return json(res.status >= 500 ? 502 : 400, { error: 'rejected' })
  } catch {
    return json(502, { error: 'cms-unreachable' })
  }
}

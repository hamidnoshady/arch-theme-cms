import { cmsOrigin } from '@/lib/env'
import { contractVersion } from '@eshobe/site-runtime'
import { cmsJson } from '@/lib/upstream'

export const dynamic = 'force-dynamic'

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(
    { theme: 'graphite', timestamp: new Date().toISOString(), ...body },
    { status, headers: { 'cache-control': 'no-store' } },
  )

/**
 * Readiness: 200 only when the CMS answers `GET /api/site` for this tenant with a
 * contract this theme supports. `?live` is a process-only liveness probe.
 */
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.has('live')) return json(200, { status: 'live' })

  const base = cmsOrigin()
  if (!base) return json(503, { status: 'unconfigured', detail: 'ESHOBE_CMS_URL is not set' })

  try {
    const { status, data } = await cmsJson<{ contractVersion?: number; status?: string; availableLocales?: string[] }>('site')
    if (status === 404) return json(503, { status: 'unknown-host' })
    if (!data) return json(503, { status: status ? 'cms-error' : 'cms-unreachable', cmsStatus: status || undefined })
    const site = data
    if (typeof site.contractVersion === 'number' && site.contractVersion !== contractVersion) {
      return json(503, { status: 'contract-mismatch', expected: contractVersion, actual: site.contractVersion })
    }
    return json(200, { status: 'ok', site: site.status, locales: site.availableLocales, contractVersion })
  } catch {
    return json(503, { status: 'cms-unreachable' })
  }
}

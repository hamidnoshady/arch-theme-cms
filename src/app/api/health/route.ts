import { cmsOrigin, siteDomain } from '@/lib/env'
import { contractVersion } from '@eshobe/site-runtime'
import { cmsJson } from '@/lib/upstream'

export const dynamic = 'force-dynamic'

const json = (status: number, body: Record<string, unknown>) =>
  Response.json(
    { theme: 'graphite', timestamp: new Date().toISOString(), ...body },
    { status, headers: { 'cache-control': 'no-store' } },
  )

/**
 * Readiness ladder:
 * - `?live` — process only
 * - default — tenant resolvable + contract compatible + CMS reachable
 */
export async function GET(req: Request) {
  if (new URL(req.url).searchParams.has('live')) return json(200, { status: 'live', renderer: 'ok' })

  const base = cmsOrigin()
  if (!base) return json(503, { status: 'unconfigured', renderer: 'ok', detail: 'ESHOBE_CMS_URL is not set' })

  const tenant = siteDomain()
  if (!tenant) {
    return json(503, { status: 'unconfigured', renderer: 'ok', detail: 'ESHOBE_SITE_DOMAIN is not set' })
  }

  try {
    const { status, data } = await cmsJson<{
      contractVersion?: number
      status?: string
      availableLocales?: string[]
      type?: string
    }>('site')
    if (status === 404) return json(503, { status: 'unknown-host', renderer: 'ok', tenant })
    if (!data) {
      return json(503, {
        status: status ? 'cms-error' : 'cms-unreachable',
        renderer: 'ok',
        tenant,
        cmsStatus: status || undefined,
      })
    }
    const site = data
    if (typeof site.contractVersion === 'number' && site.contractVersion !== contractVersion) {
      return json(503, {
        status: 'contract-mismatch',
        renderer: 'ok',
        tenant,
        expected: contractVersion,
        actual: site.contractVersion,
      })
    }
    if (site.status && site.status !== 'active') {
      return json(503, { status: 'site-inactive', renderer: 'ok', tenant, site: site.status })
    }
    return json(200, {
      status: 'ok',
      renderer: 'ok',
      tenant,
      cms: 'ok',
      site: site.status,
      siteType: site.type,
      locales: site.availableLocales,
      contractVersion,
    })
  } catch {
    return json(503, { status: 'cms-unreachable', renderer: 'ok', tenant })
  }
}

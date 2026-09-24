import { cmsOrigin, cmsRequestHeaders, siteDomain } from './env'

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

/**
 * Forward a request to the CMS `/api/*`, preserving method/body and resolving the
 * tenant via Host + site API key (`proxiesApi` contract).
 */
export async function proxyToCms(req: Request, apiPath: string): Promise<Response> {
  const base = cmsOrigin()
  if (!base) {
    return Response.json({ error: 'CMS is not configured' }, { status: 503 })
  }

  const incoming = new URL(req.url)
  const target = `${base}/api/${apiPath.replace(/^\//, '')}${incoming.search}`

  const headers = new Headers()
  req.headers.forEach((value, key) => {
    if (HOP_BY_HOP.has(key.toLowerCase())) return
    headers.set(key, value)
  })

  const platform = cmsRequestHeaders()
  for (const [key, value] of Object.entries(platform)) {
    headers.set(key, value)
  }

  // Tenant resolution prefers Host; undici may rewrite Host, so also send the
  // forwarded host the CMS edge understands when present.
  const domain = siteDomain()
  if (domain) {
    headers.set('X-Forwarded-Host', domain)
  }

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer()
  }

  try {
    const upstream = await fetch(target, init)
    const out = new Headers()
    const contentType = upstream.headers.get('content-type')
    if (contentType) out.set('content-type', contentType)
    const cacheControl = upstream.headers.get('cache-control')
    if (cacheControl) out.set('cache-control', cacheControl)
    return new Response(upstream.body, { status: upstream.status, headers: out })
  } catch {
    return Response.json({ error: 'CMS unreachable' }, { status: 502 })
  }
}

import http from 'node:http'
import https from 'node:https'
import { Readable } from 'node:stream'

import { cmsOrigin, siteApiKey, siteDomain } from './env'
import { upstreamAgents } from './upstream'

const HOP_BY_HOP = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'trailers',
  'transfer-encoding',
  'upgrade',
  'host',
  'content-length',
])

const PASS_BACK = [
  'content-type',
  'content-length',
  'content-disposition',
  'cache-control',
  'etag',
  'last-modified',
  'accept-ranges',
  'content-range',
  'retry-after',
  'vary',
  'location',
]

/**
 * Upstream headers for a visitor request.
 *
 * Tenant: with a site API key configured (every platform deployment), the request keeps
 * the CMS's own `Host`. `ESHOBE_CMS_URL` is the CMS's public address behind the Coolify
 * proxy that also serves this theme, and that proxy routes by `Host` — rewriting it to
 * the customer domain sends the request straight back into this container. Without a key
 * (local dev, the legacy Caddy edge) `Host` is the tenant, as before.
 *
 * The key itself is attached only to `keyed` requests — GET/HEAD of the public site
 * descriptor and media files, which have no drafts. Every other path (form submissions
 * take their site from the form) goes anonymously: a key reads drafts, and this proxy
 * serves anonymous traffic.
 */
const STRIP = new Set(['authorization', 'cookie', 'x-api-key'])

export function proxyHeaders(
  incoming: Headers,
  requestHost: string | null,
  { keyed = false }: { keyed?: boolean } = {},
): Record<string, string> {
  const out: Record<string, string> = {}
  incoming.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (HOP_BY_HOP.has(lower) || STRIP.has(lower)) return
    out[key] = value
  })
  const key = siteApiKey()
  if (key) {
    if (keyed) out.authorization = `Bearer ${key}`
  } else {
    const host = siteDomain() || requestHost || ''
    if (host) {
      out.host = host
      out['x-forwarded-host'] = host
    }
  }
  out['x-forwarded-proto'] = 'https'
  return out
}

/** Public, draft-free reads that may carry the site key so the CMS knows the tenant. */
export function isKeyedPath(method: string, apiPath: string): boolean {
  if (method !== 'GET' && method !== 'HEAD') return false
  const path = apiPath.replace(/^\/+/, '')
  return path === 'site' || /^media\/file\/[^/]+$/.test(path)
}

/** Forward `/api/*` to the CMS preserving method, body and tenant Host (`proxiesApi`). */
export async function proxyToCms(req: Request, apiPath: string): Promise<Response> {
  const base = cmsOrigin()
  if (!base) return Response.json({ error: 'CMS is not configured' }, { status: 503 })

  const incoming = new URL(req.url)
  const target = new URL(`${base}/api/${apiPath.replace(/^\//, '')}${incoming.search}`)
  const basePath = new URL(`${base}/api/`).pathname
  if (!target.pathname.startsWith(basePath)) {
    return Response.json({ error: 'Invalid API path' }, { status: 400 })
  }

  const headers = proxyHeaders(req.headers, req.headers.get('host'), {
    keyed: isKeyedPath(req.method, apiPath) && !incoming.searchParams.has('draft'),
  })
  const body = req.method === 'GET' || req.method === 'HEAD' ? null : Buffer.from(await req.arrayBuffer())
  if (body) headers['content-length'] = String(body.length)

  const secure = target.protocol === 'https:'
  const client = secure ? https : http

  return new Promise<Response>((resolve) => {
    const upstream = client.request(
      target,
      {
        method: req.method,
        headers,
        agent: secure ? upstreamAgents.https : upstreamAgents.http,
        servername: target.hostname,
        timeout: 20_000,
      },
      (res) => {
        const out = new Headers()
        for (const name of PASS_BACK) {
          const value = res.headers[name]
          if (typeof value === 'string') out.set(name, value)
        }
        const status = res.statusCode ?? 502
        const stream = req.method === 'HEAD' || status === 204 || status === 304 ? null : (Readable.toWeb(res) as ReadableStream)
        resolve(new Response(stream, { status, headers: out }))
      },
    )
    upstream.on('timeout', () => upstream.destroy(new Error('timeout')))
    upstream.on('error', () => resolve(Response.json({ error: 'CMS unreachable' }, { status: 502 })))
    if (body) upstream.write(body)
    upstream.end()
  })
}

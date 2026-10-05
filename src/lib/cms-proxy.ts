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

/** One file name: no separators, no dot segments, no control characters. */
const fileSegment = (segment: string) =>
  segment.length > 0 && segment.length <= 255 && segment !== '.' && segment !== '..' && !/[/\\\u0000-\u001f\u007f]/.test(segment)

/**
 * The visitor-facing `/api/*` surface, as an allowlist. A browser on this site needs the
 * public site descriptor and media files — nothing else (form submissions have their own,
 * validating route). Every other path, and every other method, is a 404 here: the CMS
 * keeps `/api/*` closed on customer domains by design, and this proxy must not reopen it
 * (no login, no staff endpoints, no `..` walk out of `/api`). Returns the canonical,
 * re-encoded CMS path, or null.
 */
export function publicApiPath(method: string, segments: string[]): string | null {
  if (method !== 'GET' && method !== 'HEAD') return null
  if (segments.length === 1 && segments[0] === 'site') return 'site'
  if (segments.length === 3 && segments[0] === 'media' && segments[1] === 'file' && fileSegment(segments[2]!)) {
    return `media/file/${encodeURIComponent(segments[2]!)}`
  }
  return null
}

/** Public, draft-free reads that may carry the site key so the CMS knows the tenant. */
export function isKeyedPath(method: string, apiPath: string): boolean {
  return publicApiPath(method, apiPath.replace(/^\/+/, '').split('/')) !== null
}

/** Forward an allowlisted, canonical `/api/*` read to the CMS (`proxiesApi`). */
export async function proxyToCms(req: Request, apiPath: string): Promise<Response> {
  const base = cmsOrigin()
  if (!base) return Response.json({ error: 'CMS is not configured' }, { status: 503 })

  const incoming = new URL(req.url)
  // Media keeps its cache-busting query; the descriptor takes none (and never `draft`).
  const search = apiPath.startsWith('media/') ? incoming.search : ''
  const target = new URL(`${base}/api/${apiPath.replace(/^\//, '')}${search}`)
  if (target.origin !== new URL(base).origin || !target.pathname.startsWith('/api/')) {
    return Response.json({ error: 'Not Found' }, { status: 404 })
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

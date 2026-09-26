import http from 'node:http'
import https from 'node:https'
import { Readable } from 'node:stream'

import { cmsOrigin, siteDomain } from './env'

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
 * Upstream headers for a visitor request. The site API key is deliberately NOT
 * attached: it can read drafts, and this proxy serves anonymous traffic. The
 * tenant is resolved by the CMS from `Host`, which is why this uses node:http —
 * WHATWG `fetch` silently drops a custom `Host` header.
 */
export function proxyHeaders(incoming: Headers, requestHost: string | null): Record<string, string> {
  const out: Record<string, string> = {}
  incoming.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) out[key] = value
  })
  const host = siteDomain() || requestHost || ''
  if (host) {
    out.host = host
    out['x-forwarded-host'] = host
  }
  out['x-forwarded-proto'] = 'https'
  return out
}

/** Forward `/api/*` to the CMS preserving method, body and tenant Host (`proxiesApi`). */
export async function proxyToCms(req: Request, apiPath: string): Promise<Response> {
  const base = cmsOrigin()
  if (!base) return Response.json({ error: 'CMS is not configured' }, { status: 503 })

  const incoming = new URL(req.url)
  const target = new URL(`${base}/api/${apiPath.replace(/^\//, '')}${incoming.search}`)
  const headers = proxyHeaders(req.headers, req.headers.get('host'))
  const body = req.method === 'GET' || req.method === 'HEAD' ? null : Buffer.from(await req.arrayBuffer())
  if (body) headers['content-length'] = String(body.length)

  const client = target.protocol === 'https:' ? https : http

  return new Promise<Response>((resolve) => {
    const upstream = client.request(
      target,
      {
        method: req.method,
        headers,
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

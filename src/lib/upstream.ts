import http from 'node:http'
import https from 'node:https'

import { cmsOrigin, cmsRequestHeaders } from './env'

/**
 * Reused connections to the CMS. Without keep-alive every lookup pays a fresh TCP + TLS
 * handshake, and a page render makes several lookups in sequence.
 */
const agents = {
  http: new http.Agent({ keepAlive: true, maxSockets: 32 }),
  https: new https.Agent({ keepAlive: true, maxSockets: 32 }),
}

export type UpstreamResult = { status: number; headers: http.IncomingHttpHeaders; body: Buffer }

/**
 * `fetch` silently discards a custom `Host`, and the CMS resolves the tenant from
 * `Host` before the API key. node:http sends the header we give it.
 */
export { agents as upstreamAgents }

export function upstreamRequest(
  target: URL,
  init: { method?: string; headers?: Record<string, string>; body?: Buffer | null; timeout?: number } = {},
): Promise<UpstreamResult> {
  const plain = target.protocol === 'http:'
  const client = plain ? http : https
  return new Promise((resolve, reject) => {
    const req = client.request(
      target,
      {
        method: init.method ?? 'GET',
        headers: init.headers,
        agent: plain ? agents.http : agents.https,
        servername: target.hostname,
        timeout: init.timeout ?? 8_000,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on('data', (chunk: Buffer) => chunks.push(chunk))
        res.on('end', () =>
          resolve({ status: res.statusCode ?? 0, headers: res.headers, body: Buffer.concat(chunks) }),
        )
      },
    )
    req.on('timeout', () => req.destroy(new Error('timeout')))
    req.on('error', reject)
    if (init.body) req.write(init.body)
    req.end()
  })
}

/** JSON GET against the CMS. `status` 0 means the CMS is not configured or unreachable. */
export async function cmsJson<T>(path: string, search = ''): Promise<{ status: number; data: T | null }> {
  const base = cmsOrigin()
  if (!base) return { status: 0, data: null }
  let target: URL
  try {
    target = new URL(`${base}/api/${path.replace(/^\//, '')}${search}`)
  } catch {
    return { status: 0, data: null }
  }
  const headers = cmsRequestHeaders()
  try {
    const res = await upstreamRequest(target, { headers })
    if (res.status < 200 || res.status >= 300) return { status: res.status, data: null }
    return { status: res.status, data: JSON.parse(res.body.toString('utf8')) as T }
  } catch {
    return { status: 0, data: null }
  }
}

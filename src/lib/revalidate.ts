import { createHmac, timingSafeEqual } from 'node:crypto'

import { revalidateSecret, siteDomain } from './env'

/**
 * CMS sends `/{domain}/{locale}/…` paths (built-in renderer shape). This theme's
 * routes have no domain segment — strip it when present.
 */
export function toThemePath(cmsPath: string, domain = siteDomain()): string {
  const raw = cmsPath.trim()
  if (!raw) return '/'
  let path = raw.startsWith('/') ? raw : `/${raw}`
  if (domain) {
    const prefix = `/${domain}`
    if (path === prefix) return '/'
    if (path.startsWith(`${prefix}/`)) path = path.slice(prefix.length) || '/'
  }
  // Posts live under /projects|/education here, not /posts — bust the tree.
  if (/(^|\/)posts(\/|$)/.test(path)) return '/'
  return path
}

export function verifyRevalidateSignature(rawBody: string, header: string | null): boolean {
  const secret = revalidateSecret()
  if (!secret || !header) return false
  const expected = `sha256=${createHmac('sha256', secret).update(rawBody).digest('hex')}`
  const a = Buffer.from(expected)
  const b = Buffer.from(header.trim())
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}

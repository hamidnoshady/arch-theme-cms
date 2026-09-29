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
  return path
}

/** Map CMS semantic resources to theme paths for path-based revalidation. */
export function pathsForResources(resources: string[]): string[] {
  const out = new Set<string>(['/'])
  for (const resource of resources) {
    const key = resource.trim().toLowerCase()
    if (!key) continue
    if (key === 'home' || key === 'site' || key === 'branding' || key === 'theme' || key === 'navigation') {
      out.add('/')
      out.add('/en')
      continue
    }
    if (key === 'sitemap') {
      out.add('/sitemap.xml')
      continue
    }
    if (
      key === 'projects' ||
      key === 'education' ||
      key === 'blog' ||
      key === 'pages' ||
      key === 'posts' ||
      key === 'categories' ||
      key === 'header' ||
      key === 'footer' ||
      key === 'forms' ||
      key === 'bindings' ||
      key === 'runtime-settings' ||
      key === 'runtimeSettings'
    ) {
      out.add(`/${key}`)
      out.add(`/en/${key}`)
      if (key === 'header' || key === 'footer') {
        out.add('/')
        out.add('/en')
      }
    }
  }
  return [...out]
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

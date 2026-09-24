import type { MetadataRoute } from 'next'
import { canonicalOrigin, publicOrigin } from '@/lib/env'

export default function robots(): MetadataRoute.Robots {
  const origin = (canonicalOrigin() || publicOrigin() || 'https://example.com').replace(/\/$/, '')
  return {
    rules: { userAgent: '*', allow: '/' },
    sitemap: `${origin}/sitemap.xml`,
  }
}

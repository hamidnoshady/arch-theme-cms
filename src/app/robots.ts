import type { MetadataRoute } from 'next'

export const dynamic = 'force-dynamic'

import { getSite } from '@/lib/cms'
import { canonicalOrigin } from '@/lib/env'

export default async function robots(): Promise<MetadataRoute.Robots> {
  const site = await getSite()
  const origin = canonicalOrigin()
  if (site && site.status !== 'active') return { rules: { userAgent: '*', disallow: '/' } }
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/'] },
    ...(origin ? { sitemap: `${origin}/sitemap.xml` } : {}),
  }
}

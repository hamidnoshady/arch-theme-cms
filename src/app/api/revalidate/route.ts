import { revalidatePath, revalidateTag } from 'next/cache'

import { CMS_TAG, invalidateCmsCache } from '@/lib/cms'
import { pathsForResources, toThemePath, verifyRevalidateSignature } from '@/lib/revalidate'

/**
 * CMS change notice (THEME_API §17). The HMAC is verified over the raw body
 * before anything is purged. Every CMS read is tagged, so one tag purge covers
 * localized slugs, section pages and listings that a path list would miss.
 */
export async function POST(req: Request) {
  const raw = await req.text()
  if (!verifyRevalidateSignature(raw, req.headers.get('x-eshobe-signature'))) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let paths: string[] = []
  let tags: string[] = []
  let resources: string[] = []
  try {
    const body = JSON.parse(raw) as { paths?: unknown; tags?: unknown; resources?: unknown }
    if (Array.isArray(body.paths)) paths = body.paths.filter((p): p is string => typeof p === 'string')
    if (Array.isArray(body.tags)) tags = body.tags.filter((p): p is string => typeof p === 'string')
    if (Array.isArray(body.resources))
      resources = body.resources.filter((p): p is string => typeof p === 'string')
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  invalidateCmsCache()
  revalidateTag(CMS_TAG, { expire: 0 })
  for (const tag of tags) revalidateTag(tag, { expire: 0 })

  const themePaths = [
    ...new Set([
      ...paths.map((p) => toThemePath(p)),
      ...pathsForResources(resources),
      ...(paths.some((p) => /(^|\/)posts(\/|$)/.test(p)) ? ['/'] : []),
    ]),
  ]
  for (const path of themePaths) {
    if (path.endsWith('.xml')) revalidatePath(path)
    else if (path !== '/') revalidatePath(path)
  }
  revalidatePath('/', 'layout')
  revalidatePath('/en', 'layout')

  return Response.json({ revalidated: true, tag: CMS_TAG, tags, paths: themePaths })
}

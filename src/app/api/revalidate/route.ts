import { revalidatePath } from 'next/cache'

import { toThemePath, verifyRevalidateSignature } from '@/lib/revalidate'

export async function POST(req: Request) {
  const raw = await req.text()
  const signature = req.headers.get('x-eshobe-signature')
  if (!verifyRevalidateSignature(raw, signature)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let paths: string[] = []
  try {
    const body = JSON.parse(raw) as { paths?: unknown }
    if (Array.isArray(body.paths)) {
      paths = body.paths.filter((p): p is string => typeof p === 'string')
    }
  } catch {
    return Response.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const themePaths = [...new Set(paths.map((p) => toThemePath(p)))]
  if (!themePaths.length) themePaths.push('/')

  for (const path of themePaths) {
    if (path === '/') revalidatePath('/', 'layout')
    else revalidatePath(path)
  }

  return Response.json({ revalidated: true, paths: themePaths })
}

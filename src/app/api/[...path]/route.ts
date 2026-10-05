import { proxyToCms, publicApiPath } from '@/lib/cms-proxy'

type Ctx = { params: Promise<{ path: string[] }> }

/** Only the allowlisted public reads reach the CMS (see `publicApiPath`); the rest is a 404. */
async function handle(req: Request, ctx: Ctx) {
  const { path } = await ctx.params
  const apiPath = publicApiPath(req.method, path)
  if (!apiPath) return Response.json({ error: 'Not Found' }, { status: 404, headers: { 'cache-control': 'no-store' } })
  return proxyToCms(req, apiPath)
}

export const GET = handle
export const HEAD = handle
const notFound = () => Response.json({ error: 'Not Found' }, { status: 404, headers: { 'cache-control': 'no-store' } })
export const POST = notFound
export const PUT = notFound
export const PATCH = notFound
export const DELETE = notFound
export const OPTIONS = notFound

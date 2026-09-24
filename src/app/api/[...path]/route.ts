import { proxyToCms } from '@/lib/cms-proxy'

type Ctx = { params: Promise<{ path: string[] }> }

async function handle(req: Request, ctx: Ctx) {
  const { path } = await ctx.params
  return proxyToCms(req, path.join('/'))
}

export const GET = handle
export const POST = handle
export const PUT = handle
export const PATCH = handle
export const DELETE = handle
export const HEAD = handle
export const OPTIONS = handle

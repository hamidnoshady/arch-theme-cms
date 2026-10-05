import { cookies, draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { cmsOrigin, siteId } from '@/lib/env'
import { isSafeLocalPath } from '@/lib/links'
import { upstreamRequest } from '@/lib/upstream'

/**
 * Draft preview for the CMS editor (the admin's «پیش‌نمایش» button and live-preview pane).
 *
 * The CMS sends the editor's session token in `token`. This deployment holds a site key,
 * so it can already read drafts — what it must not do is show them to a stranger. Draft
 * mode is therefore switched on only when the CMS itself vouches for the token, and the
 * token's owner belongs to this site (or is a platform admin).
 */
export async function GET(req: Request): Promise<Response> {
  const params = new URL(req.url).searchParams
  const path = params.get('path') ?? ''
  const token = params.get('token')

  if (!isSafeLocalPath(path)) return new Response('Invalid preview path', { status: 400 })
  if (!token || !(await editorMaySee(token))) return new Response('You are not allowed to preview this page', { status: 403 })

  const draft = await draftMode()
  draft.enable()

  // Next writes the draft cookie `SameSite=Lax` in dev, which a cross-site iframe (the
  // admin's live-preview pane) never sends — so the pane would show the published page.
  const jar = await cookies()
  const bypass = jar.get('__prerender_bypass')
  if (bypass) jar.set({ ...bypass, httpOnly: true, path: '/', sameSite: 'none', secure: true })

  redirect(path)
}

async function editorMaySee(token: string): Promise<boolean> {
  const base = cmsOrigin()
  if (!base) return false
  try {
    const res = await upstreamRequest(new URL(`${base}/api/users/me`), {
      headers: { Accept: 'application/json', Authorization: `JWT ${token}` },
    })
    if (res.status !== 200) return false
    const { user } = JSON.parse(res.body.toString('utf8')) as {
      user?: { role?: string; tenants?: Array<{ tenant?: string | { id?: string } }> } | null
    }
    if (!user) return false
    if (user.role === 'platformAdmin') return true
    const id = siteId()
    return Boolean(id) && (user.tenants ?? []).some((t) => String(typeof t.tenant === 'object' ? t.tenant?.id : t.tenant) === id)
  } catch {
    return false
  }
}

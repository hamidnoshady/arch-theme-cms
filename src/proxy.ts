import { NextResponse, type NextRequest } from 'next/server'

/**
 * Request hygiene before routing. A path whose percent-encoding cannot be decoded
 * (`/en/projects/%E0%A4`) made Next's router fail with a bare 500; it is a malformed
 * request, so it is answered 400 here and never reaches a render or the CMS.
 */
export function proxy(request: NextRequest) {
  try {
    decodeURIComponent(request.nextUrl.pathname)
  } catch {
    return new NextResponse('Bad Request', { status: 400, headers: { 'content-type': 'text/plain; charset=utf-8' } })
  }
  return NextResponse.next()
}

export const config = {
  // Pages only: static chunks, fonts and the API routes have their own handling.
  matcher: ['/((?!_next/|api/|fonts/|favicon).*)'],
}

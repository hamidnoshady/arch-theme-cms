import { proxyToCms } from '@/lib/cms-proxy'

/** Explicit form proxy so contact posts stay on-origin in every domain mode. */
export async function POST(req: Request) {
  return proxyToCms(req, 'form-submissions')
}

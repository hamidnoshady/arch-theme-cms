'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

import { startsPageChange } from '@/lib/page-transition'

/**
 * The page-change rule: a 2px ink line that grows across the top of the viewport
 * while a navigation is in flight.
 *
 * It starts on activation rather than on the router's reply, because the activation
 * is the moment the visitor needs an acknowledgement — and it is deliberately not a
 * progress bar. The stylesheet grows it on a long ease that never reaches the end, so
 * it can only ever say "working", never "almost there".
 *
 * Every activation draws it, however fast the route lands: a prefetched link can commit
 * before React renders the pending phase, so the stylesheet shows the rule on width
 * alone and the `done` phase is visible from its first frame (see motion.css).
 *
 * It is rendered outside `.shell` (see RootDocument): the drawer pushes `.shell` with
 * a transform, which would become this rule's containing block and drag it sideways.
 */
type Phase = 'idle' | 'pending' | 'done'

/** Long enough for the fill-and-fade to play out; matches motion.css. */
const DONE_MS = 560
/** A navigation that never lands must not leave the rule up for good. */
const FAILSAFE_MS = 12000

export function RouteProgress() {
  const pathname = usePathname()
  const query = useSearchParams().toString()
  const route = `${pathname}?${query}`
  /** The route as it was when a link was activated, or null when nothing is in flight. */
  const [request, setRequest] = useState<string | null>(null)

  // The phase is derived from the request instead of stored: arriving is a fact about
  // the current render, so no effect has to write state to notice it.
  const arrived = request !== null && request !== route
  const phase: Phase = request === null ? 'idle' : arrived ? 'done' : 'pending'

  useEffect(() => {
    const onActivate = (event: MouseEvent) => {
      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return

      const modified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey
      if (
        !startsPageChange({
          href: anchor.href,
          current: window.location.href,
          modified,
          target: anchor.target,
          download: anchor.hasAttribute('download'),
        })
      ) {
        return
      }
      setRequest(route)
    }

    // `click`, not `pointerdown`: a click is an activation, so keyboard Enter counts
    // and a press dragged off the link does not. The capture phase runs it before the
    // router acts on the same event.
    document.addEventListener('click', onActivate, true)
    return () => document.removeEventListener('click', onActivate, true)
  }, [route])

  useEffect(() => {
    if (request === null) return
    const timer = setTimeout(() => setRequest(null), arrived ? DONE_MS : FAILSAFE_MS)
    return () => clearTimeout(timer)
  }, [request, arrived])

  return <div className="route-progress" data-phase={phase} role="presentation" aria-hidden="true" />
}

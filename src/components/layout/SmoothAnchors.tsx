'use client'

import { useEffect } from 'react'

/**
 * Smooth scrolling, scoped to same-document anchors: the footer's "back to top",
 * the skip link, and any in-page link an editor writes in rich text.
 *
 * A global `scroll-behavior: smooth` is deliberately not used. The App Router
 * resets `documentElement.scrollTop` on every route change, and CSS smooth
 * scrolling animates that reset too, dragging the previous scroll position across
 * the freshly rendered page. Delegation keeps navigation instant and still lets
 * `scroll-padding-top` clear the sticky header.
 */
export function SmoothAnchors() {
  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return

      const anchor = (event.target as Element | null)?.closest?.('a[href]')
      if (!(anchor instanceof HTMLAnchorElement)) return
      if (anchor.target || anchor.hasAttribute('download')) return

      const url = new URL(anchor.href, location.href)
      // Same document only: cross-path links belong to the router.
      if (url.pathname !== location.pathname || url.search !== location.search) return
      if (url.hash.length < 2) return

      const target = document.getElementById(decodeURIComponent(url.hash.slice(1)))
      if (!target) return

      event.preventDefault()
      target.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
        block: 'start',
      })
      // Keep the deep link shareable. `replaceState` avoids adding a history entry
      // the App Router did not create.
      history.replaceState(null, '', url.hash)
      // Native fragment navigation focuses a focusable target (`#content` is
      // tabindex="-1"), which is how the skip link moves the caret.
      if (target.hasAttribute('tabindex')) target.focus({ preventScroll: true })
    }

    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])

  return null
}

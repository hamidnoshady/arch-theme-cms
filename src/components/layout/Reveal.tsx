'use client'

import { useEffect } from 'react'

/**
 * The one shared viewport-entrance mechanism: a delegated IntersectionObserver
 * that adds `data-reveal="in"` to `[data-reveal]` descendants once they enter
 * the viewport. Zero dependencies; one observer per page regardless of how many
 * elements opt in. Elements already in the first viewport light up immediately,
 * so nothing blocks first paint or content rendering.
 *
 * Motion lives in CSS ([data-reveal] in tokens.css); reduced-motion users and
 * browsers without IntersectionObserver get final states with no transition.
 */
export function Reveal() {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue
          entry.target.setAttribute('data-reveal', 'in')
          io.unobserve(entry.target)
        }
      },
      { rootMargin: '0px 0px -8% 0px' },
    )

    const scan = () => {
      for (const el of document.querySelectorAll('[data-reveal]')) {
        if (el.getAttribute('data-reveal') === 'in') continue
        io.observe(el)
      }
    }
    scan()

    // ⚡ Bolt: Debounce heavy DOM scans during React micro-mutations using rAF.
    // This prevents layout thrashing (O(N) traversals per frame) when many
    // elements are mounted/updated rapidly.
    let rafId: number | undefined
    const debouncedScan = () => {
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
      rafId = requestAnimationFrame(() => {
        scan()
        rafId = undefined
      })
    }

    const mo = new MutationObserver(debouncedScan)
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      if (rafId !== undefined) {
        cancelAnimationFrame(rafId)
      }
    }
  }, [])

  return null
}

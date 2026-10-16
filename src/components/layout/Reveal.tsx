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

    // Performance optimization: debounce the MutationObserver callback.
    // React frequently performs micro-mutations on the DOM tree. If we run
    // `document.querySelectorAll` synchronously on every mutation, it triggers
    // layout thrashing and blocks the main thread. Wrapping the scan call in
    // `requestAnimationFrame` ensures it only runs once per frame.
    let rafId: number | null = null
    const mo = new MutationObserver(() => {
      if (rafId !== null) return
      rafId = requestAnimationFrame(() => {
        scan()
        rafId = null
      })
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
      if (rafId !== null) cancelAnimationFrame(rafId)
    }
  }, [])

  return null
}

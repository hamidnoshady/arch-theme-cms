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

    const scan = (root: Element | Document = document) => {
      for (const el of root.querySelectorAll('[data-reveal]')) {
        if (el.getAttribute('data-reveal') === 'in') continue
        io.observe(el)
      }
    }

    // Initial scan of the whole document
    scan()

    const mo = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node instanceof Element) {
            // Check the node itself
            if (node.hasAttribute('data-reveal') && node.getAttribute('data-reveal') !== 'in') {
              io.observe(node)
            }
            // Check its descendants
            scan(node)
          }
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}

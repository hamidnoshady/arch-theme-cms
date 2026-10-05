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

    const observeNew = (el: Element) => {
      if (el.getAttribute('data-reveal') === 'in') return
      io.observe(el)
    }

    // Initial scan
    for (const el of document.querySelectorAll('[data-reveal]')) observeNew(el)

    // ⚡ Bolt: Only scan added nodes to avoid O(N) full DOM traversals on every mutation
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const node of m.addedNodes) {
            if (node instanceof Element) {
              if (node.hasAttribute('data-reveal')) observeNew(node)
              for (const el of node.querySelectorAll('[data-reveal]')) observeNew(el)
            }
          }
        } else if (m.type === 'attributes' && m.attributeName === 'data-reveal') {
          if (m.target instanceof Element && m.target.hasAttribute('data-reveal')) {
            observeNew(m.target)
          }
        }
      }
    })
    mo.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['data-reveal'] })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, [])

  return null
}

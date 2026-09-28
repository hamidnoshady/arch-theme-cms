import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...segments: string[]) =>
  readFileSync(path.join(process.cwd(), ...segments), 'utf8')

/** Comments carry the rationale; policy checks apply to declarations only. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const baseCss = () => stripComments(read('src', 'styles', 'base.css'))
const smoothAnchors = () => read('src', 'components', 'layout', 'SmoothAnchors.tsx')

describe('smooth scroll policy', () => {
  it('clears the sticky header when an anchor target is scrolled into view', () => {
    expect(baseCss()).toMatch(/scroll-padding-top:\s*calc\(var\(--header-h\)/)
  })

  it('never applies smooth scrolling globally', () => {
    // The router resets `documentElement.scrollTop` on every route change, and a
    // global `scroll-behavior: smooth` animates that reset across the new page.
    expect(baseCss()).not.toMatch(/scroll-behavior:\s*smooth/)
  })

  it('scopes the gesture to same-document anchors', () => {
    const source = smoothAnchors()
    expect(source).toMatch(/scrollIntoView\(/)
    expect(source).toMatch(/url\.pathname !== location\.pathname/)
    expect(source).toMatch(/prefers-reduced-motion: reduce/)
    expect(source).toMatch(/event\.preventDefault\(\)/)
  })

  it('is mounted on every interior page', () => {
    expect(read('src', 'components', 'layout', 'PageShell.tsx')).toMatch(/<SmoothAnchors \/>/)
  })
})

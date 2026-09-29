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

  it('smooth-scrolls site-wide, but never under reduced motion', () => {
    expect(baseCss()).toMatch(
      /@media \(prefers-reduced-motion: no-preference\)\s*\{\s*html\s*\{\s*scroll-behavior:\s*smooth/,
    )
  })

  it('lets Next disable smooth scrolling for the router\'s own scroll reset', () => {
    // Without this, a route change animates the old scroll position across the new page.
    expect(read('src', 'components', 'layout', 'RootDocument.tsx')).toMatch(/data-scroll-behavior="smooth"/)
  })

  it('keeps in-page anchors shareable and focusable', () => {
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

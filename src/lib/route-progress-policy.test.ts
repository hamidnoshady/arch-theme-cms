import { readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), 'utf8')

/** Comments carry the rationale; policy checks apply to declarations only. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const motionCss = () => stripComments(read('src', 'styles', 'motion.css'))

const STYLE_DIR = path.join(process.cwd(), 'src', 'styles')

function styleFiles(): string[] {
  return readdirSync(STYLE_DIR)
    .filter((file) => file.endsWith('.css'))
    .map((file) => path.join(STYLE_DIR, file))
}

describe('route progress policy', () => {
  it('defines a resting state and the three phases the component renders', () => {
    const css = motionCss()
    expect(css).toMatch(/\.route-progress\s*\{[^}]*transform:\s*scaleX\(0\.06\)[^}]*opacity:\s*0/)
    expect(css).toMatch(/\.route-progress\[data-phase='pending'\]/)
    expect(css).toMatch(/\.route-progress\[data-phase='done'\]/)
  })

  it('is an acknowledgement, not a gauge', () => {
    // The fill flattens before it reaches the end, so the rule can never claim to be
    // nearly finished — and it takes far longer than a real navigation to get there.
    const tokens = stripComments(read('src', 'styles', 'tokens.css'))
    expect(tokens).toMatch(/--route-dur:\s*[\d.]+s/)
    expect(motionCss()).toMatch(/\.route-progress\[data-phase='pending'\]\s*\{[^}]*scaleX\(0\.92\)/)
  })

  it('draws a legible line inside one real page change', () => {
    // A rule that spends the whole navigation inside its first tenth is a speck at the
    // corner, which is why a visitor could not see that anything was happening. The fill
    // is bounded, and the resting geometry is a stub so the first painted frame is a mark
    // rather than a few pixels of a transition out of zero.
    const tokens = stripComments(read('src', 'styles', 'tokens.css'))
    const duration = Number.parseFloat(tokens.match(/--route-dur:\s*([\d.]+)s/)?.[1] ?? '0')
    expect(duration).toBeGreaterThan(0)
    expect(duration).toBeLessThanOrEqual(4)
    const resting = motionCss().match(/\.route-progress\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(resting).toMatch(/transform:\s*scaleX\(0\.0[1-9]\d*\)/)
  })

  it('is drawn below the safe-area inset, like the header it shares a top edge with', () => {
    // The layout exports `viewport-fit=cover`, so `top: 0` is the status bar on a phone.
    const progress = motionCss().match(/\.route-progress\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(progress).toMatch(/top:\s*env\(safe-area-inset-top\)/)
    const reading = motionCss().match(/\.reading-progress\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(reading).toMatch(/top:\s*env\(safe-area-inset-top\)/)
  })

  it('is visible on width alone, so no page change can go unacknowledged', () => {
    // A prefetched link can commit its route before React renders `pending`, so the rule
    // must also be visible when it goes straight from `idle` to `done`.
    const css = motionCss()
    const pending = css.match(/[^}]*\.route-progress\[data-phase='pending'\]\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(pending).toMatch(/opacity:\s*1/)
    // Opacity must not be transitioned here: the rule is up the instant it starts.
    expect(pending).not.toMatch(/transition:[^;]*opacity/)
    // `done` fades with an animation, which paints from its first frame.
    expect(css).toMatch(/\.route-progress\[data-phase='done'\]\s*\{[^}]*animation:\s*route-progress-out/)
    expect(css).toMatch(/@keyframes route-progress-out\s*\{[\s\S]*?opacity:\s*1[\s\S]*?opacity:\s*0/)
  })

  it('fills from the reading edge in both directions', () => {
    // `transform-origin: inline-start` looks right and is silently invalid: every rule
    // written that way grows outward from its centre instead of from the start edge.
    for (const file of styleFiles()) {
      expect(stripComments(readFileSync(file, 'utf8')), file).not.toMatch(
        /transform-origin:\s*inline-start/,
      )
    }
    expect(motionCss()).toMatch(/transform-origin:\s*var\(--origin-inline-start\)/)
    const tokens = stripComments(read('src', 'styles', 'tokens.css'))
    expect(tokens).toMatch(/--origin-inline-start:\s*left/)
    expect(tokens).toMatch(/html\[dir='rtl'\]\s*\{[^}]*--origin-inline-start:\s*right/)
  })

  it('never withholds the acknowledgement behind a debounce', () => {
    expect(motionCss()).not.toMatch(/transition:[^;]*opacity[^;]*\d+ms/)
  })

  it('stays put when the drawer pushes the page, and stays quiet for screen readers', () => {
    // Mounted in <body>, outside `.shell`: the drawer's transform would otherwise
    // become the rule's containing block and drag it sideways.
    const rootDocument = read('src', 'components', 'layout', 'RootDocument.tsx')
    // The boundary matters: the rule reads the query string, and a statically
    // prerendered 404 has no `useSearchParams` without one.
    expect(rootDocument).toMatch(/<Suspense fallback=\{null\}>\s*<RouteProgress \/>\s*<\/Suspense>/)
    expect(read('src', 'components', 'layout', 'PageShell.tsx')).not.toMatch(/RouteProgress/)
    const component = read('src', 'components', 'layout', 'RouteProgress.tsx')
    expect(component).toMatch(/aria-hidden="true"/)
    expect(component).toMatch(/role="presentation"/)
  })

  it('only reacts to activations that leave this document', () => {
    const component = read('src', 'components', 'layout', 'RouteProgress.tsx')
    expect(component).toMatch(/startsPageChange\(\{/)
    // A click is an activation, so keyboard Enter is covered and a press dragged off
    // the link is not.
    expect(component).toMatch(/addEventListener\('click', onActivate, true\)/)
  })
})

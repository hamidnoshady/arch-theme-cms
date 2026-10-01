import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), 'utf8')

/** Comments carry the rationale; policy checks apply to declarations only. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const media = () => stripComments(read('src', 'styles', 'media.css'))
const motion = () => stripComments(read('src', 'styles', 'motion.css'))

describe('card frame policy', () => {
  it('floats the frame inside the card instead of drawing on the card edge', () => {
    const css = media()
    expect(css).toMatch(/\.card\s*\{[^}]*padding:\s*var\(--card-mat\)/)
    // A border on the card itself would put the hairline back on the layout box.
    expect(css).not.toMatch(/\.card\s*\{[^}]*border:/)
  })

  it('holds the mat as a system value and the hairline on the inner frame', () => {
    expect(stripComments(read('src', 'styles', 'tokens.css'))).toMatch(/--card-mat:\s*5px/)
    expect(media()).toMatch(/\.card__link\s*\{[^}]*border:\s*1px solid var\(--color-line\)/)
  })

  it('lands hover and focus on the frame, which is the card a visitor sees', () => {
    expect(media()).toMatch(
      /\.card:hover \.card__link,\s*\.card:focus-within \.card__link\s*\{[^}]*border-color:\s*var\(--color-ink\)/,
    )
  })

  it('steps the box internals down where two per row leaves a phone-sized box', () => {
    const compact = media().slice(media().indexOf('@media (max-width: 640px)'))
    expect(compact).toMatch(/\.card__link\s*\{\s*padding:\s*var\(--frame-inset\)/)
    expect(compact).toMatch(/\.card__title\s*\{\s*font-size:\s*var\(--text-ui\)/)
    expect(compact).toMatch(/\.card__excerpt\s*\{\s*display:\s*none/)
  })

  it('tells the browser the box width the grid actually hands out', () => {
    // A stale hint makes a phone download desktop-sized files (or a desktop, blurry ones).
    expect(read('src', 'components', 'entries', 'EntryCard.tsx')).toMatch(
      /sizes="\(min-width: 1081px\) 30vw, 46vw"/,
    )
  })

  it('still suppresses the frame transition under reduced motion', () => {
    expect(motion()).toMatch(/\.card__link,[\s\S]{0,300}transition:\s*none/)
  })

  it('keeps three boxes per row on a desktop canvas and two on tablet and phone', () => {
    const css = media()
    expect(css).toMatch(/\.entry-grid\s*\{[^}]*grid-template-columns:\s*repeat\(3,/)
    expect(css).toMatch(/@media \(max-width: 1080px\)\s*\{\s*\.entry-grid\s*\{\s*grid-template-columns:\s*repeat\(2,/)
    // No single-column state: one column of boxes spends a phone's whole scroll on a
    // handful of items.
    expect(css).not.toMatch(/\.entry-grid[^{]*\{[^}]*grid-template-columns:\s*1fr/)
  })

  it('lays cards out on a grid', () => {
    expect(media()).toMatch(/\.entry-grid\s*\{[^}]*display:\s*grid/)
  })
})

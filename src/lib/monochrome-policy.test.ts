import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const STYLE_DIR = path.join(process.cwd(), 'src/styles')
const TOKENS = path.join(STYLE_DIR, 'tokens.css')

const styleFiles = () =>
  readdirSync(STYLE_DIR)
    .filter((f) => f.endsWith('.css'))
    .map((f) => path.join(STYLE_DIR, f))

const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

describe('monochrome policy', () => {
  it('declares black and white as the only literal palette in tokens.css', () => {
    const tokens = stripComments(readFileSync(TOKENS, 'utf8'))
    const literals = tokens.match(/#[0-9a-f]{3,8}\b/gi) ?? []
    for (const hex of literals) {
      expect(['#000', '#000000', '#fff', '#ffffff'], hex.toLowerCase()).toContain(hex.toLowerCase())
    }
  })

  it('keeps every grey a transparency step of ink, not a hex value', () => {
    const tokens = stripComments(readFileSync(TOKENS, 'utf8'))
    for (const key of ['--color-ink', '--color-navy', '--color-muted', '--color-line', '--color-frame', '--color-soft', '--color-soft-2', '--color-accent']) {
      expect(tokens, key).toContain(key)
    }
    // Every color literal in tokens.css must be pure black or pure white.
    const literals = tokens.match(/#[0-9a-f]{3,8}\b/gi) ?? []
    for (const hex of literals) {
      expect(['#000', '#000000', '#fff', '#ffffff'], hex.toLowerCase()).toContain(hex.toLowerCase())
    }
  })

  it('prohibits gradients and legacy grey/navy values across all styles', () => {
    for (const file of styleFiles()) {
      const css = stripComments(readFileSync(file, 'utf8'))
      expect(css, file).not.toMatch(/linear-gradient|radial-gradient|conic-gradient/)
      for (const legacy of ['#e7eaec', '#eef0f2', '#8b9196', '#7a2e2e', '#e4ebf0', '#d7dce0', '#e4e8eb', '#f3f4f5', '#f7f7f7', '#777d81', '#171717']) {
        expect(css, `${file} ${legacy}`).not.toMatch(new RegExp(legacy, 'i'))
      }
    }
  })

  it('keeps homepage geometry to solid rules, not translucent planes', () => {
    const home = stripComments(readFileSync(path.join(STYLE_DIR, 'home.css'), 'utf8'))
    // The datum rules exist and use the palette directly — no fills of their own.
    expect(home).toMatch(/\.home__line--v/)
    expect(home).toMatch(/\.home__line--h/)
    expect(home).toMatch(/\.home__line {[^}]*background:\s*var\(--color-ink\)/)
    expect(home).not.toMatch(/\.home__line[^{]*{[^}]*fill:/)
    expect(home).not.toMatch(/\.home__line[^{]*{[^}]*background:\s*#/) 
  })

  it('reallocated CMS colours arrive as the monochrome pair', () => {
    const src = readFileSync(path.join(process.cwd(), 'src/lib/theme/tokens.ts'), 'utf8')
    expect(src).toMatch(/primary:\s*'#000000'/)
    expect(src).toMatch(/accent:\s*'#000000'/)
  })
})

describe('motion policy', () => {
  it('drives entrances from a shared observer, not per-element effects', () => {
    const reveal = readFileSync(path.join(process.cwd(), 'src/components/layout/Reveal.tsx'), 'utf8')
    expect(reveal).toMatch(/IntersectionObserver/)
    expect(reveal).not.toMatch(/setInterval|setTimeout\([^)]*,\s*(?!.*unobserve)/)
  })

  it('guarantees final states for reduced motion in every animated layer', () => {
    for (const file of ['tokens.css', 'home.css', 'chrome.css', 'base.css', 'media.css']) {
      const css = stripComments(readFileSync(path.join(STYLE_DIR, file), 'utf8'))
      expect(css, file).toMatch(/prefers-reduced-motion:\s*reduce/)
    }
  })

  it('honours reduced motion in the shared observer itself', () => {
    const reveal = readFileSync(path.join(process.cwd(), 'src/components/layout/Reveal.tsx'), 'utf8')
    expect(reveal).toMatch(/prefers-reduced-motion:\s*reduce/)
  })

  it('keeps the intro clock and its default in sync (~2.5s)', () => {
    const settings = readFileSync(path.join(process.cwd(), 'src/lib/theme/settings.ts'), 'utf8')
    expect(settings).toMatch(/introDurationMs:\s*2500/)
    const manifest = JSON.parse(readFileSync(path.join(process.cwd(), 'eshobe.theme.json'), 'utf8')) as {
      settings?: Record<string, { default?: unknown }>
    }
    expect(manifest.settings?.introDuration?.default).toBe(2500)
    const stage = readFileSync(path.join(process.cwd(), 'src/components/home/HomeStage.tsx'), 'utf8')
    expect(stage).toMatch(/DEFAULT_INTRO_MS = 2500/)
  })
})

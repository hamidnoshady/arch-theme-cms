import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const STYLE_DIR = path.join(process.cwd(), 'src/styles')
const SKIP_FILES = new Set(['tokens.css', 'typography.css'])

/** Manual QA sentence — mixed direction, digits, Latin, currency (see AGENTS.md). */
export const MIXED_UI_TEST_SENTENCE = 'سفارش #INV-2048 — Dell Latitude 5431 — ۱۲۵٬۰۰۰ تومان'

function styleFiles(): string[] {
  return readdirSync(STYLE_DIR)
    .filter((f) => f.endsWith('.css') && !SKIP_FILES.has(f))
    .map((f) => path.join(STYLE_DIR, f))
}

describe('typography policy', () => {
  it('documents the mixed FA/EN QA sentence', () => {
    expect(MIXED_UI_TEST_SENTENCE).toMatch(/INV-2048/)
    expect(MIXED_UI_TEST_SENTENCE).toMatch(/سفارش/)
  })

  it('does not hard-code legacy sans stacks in styles', () => {
    const hay = styleFiles().map((f) => readFileSync(f, 'utf8')).join('\n')
    expect(hay).not.toMatch(/Helvetica Neue/i)
    expect(hay).not.toMatch(/Arial/i)
  })

  it('does not use marketing weights (700–900) in component styles', () => {
    for (const file of styleFiles()) {
      const css = readFileSync(file, 'utf8')
      expect(css, file).not.toMatch(/font-weight:\s*[789]\d{2}\b/)
    }
  })

  it('does not use 10px except in tokens (micro / legal only)', () => {
    for (const file of styleFiles()) {
      const css = readFileSync(file, 'utf8')
      expect(css, file).not.toMatch(/font-size:\s*10px/)
    }
  })

  it('defines semantic roles in tokens.css', () => {
    const tokens = readFileSync(path.join(STYLE_DIR, 'tokens.css'), 'utf8')
    for (const key of [
      '--text-display-weight',
      '--text-heading-weight',
      '--text-body-weight',
      '--text-label-weight',
      '--text-emphasis-weight',
      '--font-brand',
      '--font-ui',
    ]) {
      expect(tokens, key).toContain(key)
    }
  })

  it('retires the micro scale and keeps the smallest size at the 13px meta floor', () => {
    const tokens = readFileSync(path.join(STYLE_DIR, 'tokens.css'), 'utf8')
    expect(tokens).not.toContain('--text-micro')
    expect(tokens).toMatch(/--text-meta:\s*0\.8125rem/)
    for (const file of styleFiles()) {
      const css = readFileSync(file, 'utf8')
      expect(css, file).not.toMatch(/--text-micro\b/)
    }
  })

  it('bounds the display scale to the 42–72px band', () => {
    const tokens = readFileSync(path.join(STYLE_DIR, 'tokens.css'), 'utf8')
    expect(tokens).toMatch(/--text-display:[^;]*4\.5rem/)
    expect(tokens).toMatch(/--text-display:[^;]*2\.625rem/)
    expect(tokens).not.toMatch(/5\.75rem|92px/)
  })

  it('sizes rich-text headings from semantic tokens, not raw pixels', () => {
    const content = readFileSync(path.join(STYLE_DIR, 'content.css'), 'utf8')
    expect(content).not.toMatch(/\.rt-h3[^}]*font-size:\s*\d+px/)
    expect(content).not.toMatch(/\.numbered-list__title[^}]*font-size:\s*20px/)
  })
})

/** Comments are documentation, not declarations — and several of them quote selectors. */
function stripComments(css: string): string {
  return css.replace(/\/\*[\s\S]*?\*\//g, '')
}

function readTokens(): string {
  return stripComments(readFileSync(path.join(STYLE_DIR, 'tokens.css'), 'utf8'))
}

/** Body of the first rule whose prelude contains `header`, braces balanced. */
function block(css: string, header: string): string {
  const at = css.indexOf(header)
  expect(at, `missing block: ${header}`).toBeGreaterThan(-1)
  const open = css.indexOf('{', at)
  let depth = 0
  for (let i = open; i < css.length; i++) {
    if (css[i] === '{') depth++
    else if (css[i] === '}' && --depth === 0) return css.slice(open + 1, i)
  }
  throw new Error(`unbalanced block: ${header}`)
}

function declared(css: string, token: string): string | null {
  const m = css.match(new RegExp(`${token}:\\s*([^;]+);`))
  return m ? m[1].trim() : null
}

const MOBILE_STEP = '@media (max-width: 640px)'

/** Evaluate a `clamp(min, a + b vw, max)` declaration at a viewport width, in px. */
function clampAt(decl: string, vw: number): number {
  const parts = decl.replace(/^clamp\(|\)$/g, '').split(',')
  expect(parts, `not a three-part clamp: ${decl}`).toHaveLength(3)
  const preferred = parts[1].match(/(-?[\d.]+)rem\s*\+\s*([\d.]+)vw/)
  expect(preferred, `unexpected preferred term in: ${decl}`).not.toBeNull()
  const size = Number.parseFloat(preferred![1]) * 16 + (Number.parseFloat(preferred![2]) / 100) * vw
  return Math.min(Math.max(size, Number.parseFloat(parts[0]) * 16), Number.parseFloat(parts[2]) * 16)
}

/** AGENTS.md size standards, in px, for the roles that must land inside a band. */
const MOBILE_BANDS: Record<string, [min: number, max: number]> = {
  h1: [28, 40],
  h2: [20, 30],
  h3: [16, 22],
  'body-lg': [16, 18],
  body: [16, 17],
  ui: [13, 15],
  label: [13, 14],
  meta: [12, 13],
}

describe('responsive typography step', () => {
  it('gives every sized role an explicit phone value inside its AGENTS band', () => {
    const tokens = readTokens()
    const mobile = block(tokens, MOBILE_STEP)
    const px = (role: string) => {
      const raw = declared(mobile, `--text-${role}`) ?? declared(block(tokens, ':root'), `--text-${role}`)
      // A clamp on a phone hides the real size, so roles that need one must step down explicitly.
      expect(raw, `--text-${role} needs an explicit rem value at ${MOBILE_STEP}`).toMatch(/^[\d.]+rem$/)
      return Number.parseFloat(raw as string) * 16
    }
    for (const [role, [min, max]] of Object.entries(MOBILE_BANDS)) {
      const size = px(role)
      expect(size, `--text-${role} on a phone`).toBeGreaterThanOrEqual(min)
      expect(size, `--text-${role} on a phone`).toBeLessThanOrEqual(max)
    }
    // Hierarchy stays legible: each heading role is strictly larger than the next
    // step down, and a heading never drops to body size.
    expect(px('h1')).toBeGreaterThan(px('h2'))
    expect(px('h2')).toBeGreaterThan(px('h3'))
    expect(px('h3')).toBeGreaterThan(px('body-lg'))
    expect(px('body-lg')).toBeGreaterThan(px('ui'))
  })

  it('drops the page-title and section-heading roles one rung on a phone', () => {
    const tokens = readTokens()
    expect(declared(block(tokens, ':root'), '--text-title')).toBe('var(--text-display)')
    expect(declared(block(tokens, ':root'), '--text-section')).toBe('var(--text-h1)')
    const mobile = block(tokens, MOBILE_STEP)
    expect(declared(mobile, '--text-title')).toBe('var(--text-h1)')
    expect(declared(mobile, '--text-section')).toBe('var(--text-h2)')
  })

  it('drops a page intro heading clear of the page title on a phone', () => {
    // A standfirst one rung under the title reads as a second title on a narrow screen.
    const tokens = readTokens()
    expect(declared(block(tokens, ':root'), '--text-standfirst')).toBe('var(--text-h2)')
    expect(declared(block(tokens, MOBILE_STEP), '--text-standfirst')).toBe('var(--text-h3)')
    const mobile = block(tokens, MOBILE_STEP)
    const size = (token: string) => Number.parseFloat(declared(mobile, token) ?? '0') * 16
    // title (h1) vs standfirst (h3): a standfirst is never within 1.5x of the title.
    expect(size('--text-h1')).toBeGreaterThan(size('--text-h3') * 1.5)
    expect(size('--text-h3')).toBeGreaterThan(size('--text-body'))
  })

  it('keeps a page title clear of section headings at every width', () => {
    const root = block(readTokens(), ':root')
    const display = declared(root, '--text-display') as string
    const h1 = declared(root, '--text-h1') as string
    // The two statement rungs must climb together: a display scale that surges
    // ahead of h1 on a tablet canvas is what made mid-size screens shout.
    for (const vw of [641, 768, 900, 981, 1100, 1280, 1440, 1600]) {
      expect(clampAt(h1, vw), `section heading at ${vw}px`).toBeLessThan(clampAt(display, vw) / 1.15)
    }
    expect(clampAt(display, 390), 'a phone stays inside the display band').toBeLessThanOrEqual(72)
  })

  it('routes Persian-visible label tracking through tokens so it can be cancelled', () => {
    const tokens = readTokens()
    expect(tokens).toMatch(/--tracking-label:\s*0\.04em/)
    expect(tokens).toMatch(/--tracking-ui:\s*0\.02em/)
    const fa = block(tokens, "html[lang='fa']")
    expect(declared(fa, '--tracking-label')).toBe('normal')
    expect(declared(fa, '--tracking-ui')).toBe('normal')
    // Raw ems in these ranges are label tracking. AGENTS.md keeps it for the Latin
    // brand lockup only, so every other rule must go through the tokens.
    const raw: string[] = []
    for (const file of styleFiles()) {
      for (const chunk of readFileSync(file, 'utf8').split('}')) {
        if (!/letter-spacing:\s*0\.(01|02|04)em/.test(chunk)) continue
        if (chunk.includes('.logo__wordmark')) continue
        raw.push(`${path.basename(file)}: ${chunk.split('{')[0].trim().split('\n').pop()?.trim()}`)
      }
    }
    expect(raw).toEqual([])
  })

  it('sets the header wordmark large enough to read as a name', () => {
    const home = stripComments(readFileSync(path.join(STYLE_DIR, 'home.css'), 'utf8'))
    const rule = home.match(/\.logo--compact \.logo__wordmark\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(rule).toMatch(/font-size:\s*var\(--text-body-lg\)/)
    const tracking = Number(rule.match(/letter-spacing:\s*([\d.]+)em/)?.[1] ?? 0)
    expect(tracking).toBeLessThanOrEqual(0.1)
  })
})

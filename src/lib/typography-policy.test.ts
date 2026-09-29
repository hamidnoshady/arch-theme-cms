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

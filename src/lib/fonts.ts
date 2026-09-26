import { readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Licensed Shazde files live in `public/fonts/`. Runtime `@font-face` injection is
 * replaced by `next/font/local` in `shazde-font.ts` (four UI weights). This module
 * detects which files exist for fallbacks and tests.
 *
 * Weights 700–900 may exist on disk but are not part of the application typography
 * system unless a future design-system change explicitly adds them.
 */
export const APPLICATION_SHAZDE_WEIGHTS = new Set(['300', '400', '500', '600'])

const WEIGHTS: Record<string, string> = {
  thin: '100',
  extralight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  ultrabold: '800',
  extrabold: '850',
  black: '900',
  variable: '100 900',
}

export type FontFile = { file: string; weight: string }

export function parseShazdeFiles(files: string[]): FontFile[] {
  const found: FontFile[] = []
  for (const file of files) {
    const m = file.match(/^shazde[-_]?([a-z]*)\.(woff2|woff)$/i)
    if (!m) continue
    const weight = WEIGHTS[(m[1] || 'regular').toLowerCase()]
    if (weight) found.push({ file, weight })
  }
  const variable = found.filter((f) => f.weight.includes(' '))
  const list = variable.length ? variable : found
  return list
    .sort((a, b) => Number(b.file.endsWith('.woff2')) - Number(a.file.endsWith('.woff2')))
    .filter((f, i, arr) => arr.findIndex((o) => o.weight === f.weight) === i)
}

export function applicationShazdeFiles(files: FontFile[]): FontFile[] {
  return files.filter((f) => !f.weight.includes(' ') && APPLICATION_SHAZDE_WEIGHTS.has(f.weight))
}

let cached: FontFile[] | null = null

export function shazdeFiles(): FontFile[] {
  if (cached) return cached
  try {
    cached = parseShazdeFiles(readdirSync(path.join(process.cwd(), 'public', 'fonts')))
  } catch {
    cached = []
  }
  return cached
}

/** True when at least Regular (400) is present — UI uses next/font, this gates CSS fallbacks. */
export function shazdeUiReady(files = shazdeFiles()): boolean {
  const app = applicationShazdeFiles(files)
  return app.some((f) => f.weight === '400')
}

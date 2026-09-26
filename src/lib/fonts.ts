import { readdirSync } from 'node:fs'
import path from 'node:path'

/**
 * Shazde is licensed and never committed. The owner drops the files into
 * `public/fonts/` using these names; only files that exist get an `@font-face`,
 * so an unconfigured deploy makes no failing font requests and falls back to
 * Vazirmatn.
 *
 *   Shazde-Variable.woff2              → weights 100–900 (preferred)
 *   Shazde-Light.woff2 / -Regular / -Medium / -SemiBold / -Bold
 */
const WEIGHTS: Record<string, string> = {
  thin: '100',
  extralight: '200',
  light: '300',
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
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

export function shazdeCss(files = shazdeFiles()): string {
  return files
    .map(
      ({ file, weight }) =>
        `@font-face{font-family:Shazde;src:url('/fonts/${file}') format('${file.endsWith('.woff2') ? 'woff2' : 'woff'}');font-weight:${weight};font-style:normal;font-display:swap}`,
    )
    .join('')
}

import { describe, expect, it } from 'vitest'

import {
  APPLICATION_SHAZDE_WEIGHTS,
  applicationShazdeFiles,
  parseShazdeFiles,
  shazdeUiReady,
} from './fonts'

describe('Shazde font files', () => {
  it('ignores anything that is not a licensed font file', () => {
    expect(parseShazdeFiles(['readme.txt', 'logo.svg'])).toEqual([])
  })

  it('prefers the variable font over static cuts', () => {
    const files = parseShazdeFiles(['Shazde-Regular.woff2', 'Shazde-Variable.woff2', 'Shazde-Bold.woff'])
    expect(files).toEqual([{ file: 'Shazde-Variable.woff2', weight: '100 900' }])
  })

  it('filters application UI to four weights (300–600)', () => {
    const all = parseShazdeFiles([
      'Shazde-Light.woff2',
      'Shazde-Regular.woff2',
      'Shazde-Medium.woff2',
      'Shazde-SemiBold.woff2',
      'Shazde-Bold.woff2',
      'Shazde-Black.woff2',
    ])
    expect(applicationShazdeFiles(all).map((f) => f.weight).sort()).toEqual(['300', '400', '500', '600'])
    expect(APPLICATION_SHAZDE_WEIGHTS.size).toBe(4)
  })

  it('marks UI ready when Regular is on disk', () => {
    expect(shazdeUiReady([{ file: 'Shazde-Regular.woff2', weight: '400' }])).toBe(true)
    expect(shazdeUiReady([{ file: 'Shazde-Light.woff2', weight: '300' }])).toBe(false)
  })
})

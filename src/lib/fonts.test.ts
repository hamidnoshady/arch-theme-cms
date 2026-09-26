import { describe, expect, it } from 'vitest'

import { parseShazdeFiles, shazdeCss } from './fonts'

describe('Shazde font files', () => {
  it('ignores anything that is not a licensed font file', () => {
    expect(parseShazdeFiles(['readme.txt', 'logo.svg'])).toEqual([])
  })

  it('prefers the variable font over static cuts', () => {
    const files = parseShazdeFiles(['Shazde-Regular.woff2', 'Shazde-Variable.woff2', 'Shazde-Bold.woff'])
    expect(files).toEqual([{ file: 'Shazde-Variable.woff2', weight: '100 900' }])
  })

  it('emits one face per weight that is actually present', () => {
    const css = shazdeCss([
      { file: 'Shazde-Regular.woff2', weight: '400' },
      { file: 'Shazde-Light.woff2', weight: '300' },
    ])
    expect(css).toContain("url('/fonts/Shazde-Regular.woff2')")
    expect(css).toContain('font-weight:300')
    expect(css).not.toContain('font-weight:700')
  })

  it('maps optional heavy static cuts including UltraBold', () => {
    expect(parseShazdeFiles(['Shazde-UltraBold.woff2', 'Shazde-Black.woff2'])).toEqual([
      { file: 'Shazde-UltraBold.woff2', weight: '800' },
      { file: 'Shazde-Black.woff2', weight: '900' },
    ])
  })
})

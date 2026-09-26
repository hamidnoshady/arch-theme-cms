import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { contractVersion } from '@eshobe/site-runtime'

describe('eshobe.theme.json', () => {
  it('matches the installed site-runtime contract version', () => {
    const manifest = JSON.parse(readFileSync('eshobe.theme.json', 'utf8')) as { contractVersion: number }
    expect(manifest.contractVersion).toBe(contractVersion)
  })
})

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import { contractVersion } from '@eshobe/site-runtime'

describe('eshobe.theme.json', () => {
  it('matches the installed site-runtime contract version', () => {
    const manifest = JSON.parse(readFileSync('eshobe.theme.json', 'utf8')) as { contractVersion: number }
    expect(manifest.contractVersion).toBe(contractVersion)
  })

  it('declares GHCR registry deployment and Dockerfile build contract', () => {
    const manifest = JSON.parse(readFileSync('eshobe.theme.json', 'utf8')) as {
      build: { buildPack: string; dockerfileLocation: string }
      deployment: { registryImageRepository: string; strategy: string }
    }
    expect(manifest.deployment.strategy).toBe('registry_image')
    expect(manifest.deployment.registryImageRepository).toBe('ghcr.io/hamidnoshady/arch-theme-cms')
    expect(manifest.build.buildPack).toBe('dockerfile')
    expect(manifest.build.dockerfileLocation).toBe('Dockerfile')
  })
})

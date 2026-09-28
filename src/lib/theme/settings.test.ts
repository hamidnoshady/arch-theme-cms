import { describe, expect, it } from 'vitest'

import { resolveRuntimeSettings } from './settings'

describe('resolveRuntimeSettings', () => {
  it('prefers themeRuntime.settings over manifest defaults', () => {
    const resolved = resolveRuntimeSettings({
      introAnimation: false,
      introDuration: 12_000,
    })
    expect(resolved.introAnimation).toBe(false)
    expect(resolved.introDurationMs).toBe(12_000)
  })

  it('clamps intro duration to 0–20000', () => {
    expect(resolveRuntimeSettings({ introDuration: 99_999 }).introDurationMs).toBe(20_000)
    expect(resolveRuntimeSettings({ introDuration: -5 }).introDurationMs).toBe(0)
  })
})

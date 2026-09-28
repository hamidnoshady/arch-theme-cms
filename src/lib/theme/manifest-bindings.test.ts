import { describe, expect, it } from 'vitest'

import { effectiveBindings } from './manifest-bindings'

describe('effectiveBindings', () => {
  it('fills contact and services slugs from manifest when site bindings omit them', () => {
    const bindings = effectiveBindings({
      availableLocales: ['fa'],
      blocks: [],
      contractVersion: 1,
      defaultLocale: 'fa',
      domain: 'x.ir',
      status: 'active',
      themeRuntime: { bindings: { homePage: 'home' } },
    })
    expect(bindings?.contactPage).toBe('contact')
    expect(bindings?.servicesPage).toBe('services')
  })
})

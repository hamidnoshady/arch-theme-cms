import { describe, expect, it } from 'vitest'

import { graphiteLogoMarkup } from './graphite-logo-markup'

describe('graphiteLogoMarkup', () => {
  it('exposes animation class hooks and no embedded stylesheet', () => {
    const html = graphiteLogoMarkup(true)
    expect(html).not.toContain('<style>')
    expect(html).toContain('class="logo--animated"')
    expect(html).toContain('logo__strokes')
    expect(html).toContain('logo__shade')
    expect(html).toContain('logo__wordmark')
    expect(html).toContain('logo__subtitle')
    expect(html).toContain('pathLength="1"')
    expect(html).toContain('--i:0')
  })

  it('omits logo--animated when not animating', () => {
    const html = graphiteLogoMarkup(false)
    expect(html).not.toContain('logo--animated')
  })
})

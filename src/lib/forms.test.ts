import { describe, expect, it } from 'vitest'

import { safeFormRedirect, validateFormField } from './forms'

const msg = { required: 'required', invalidEmail: 'email', invalidNumber: 'number' }

describe('form validation', () => {
  it('requires filled fields', () => {
    expect(validateFormField({ blockType: 'text', name: 'n', required: true }, '', msg)).toBe('required')
    expect(validateFormField({ blockType: 'text', name: 'n', required: true }, 'ok', msg)).toBeNull()
  })

  it('validates email shape', () => {
    expect(validateFormField({ blockType: 'email', name: 'e', required: true }, 'bad', msg)).toBe('email')
    expect(validateFormField({ blockType: 'email', name: 'e', required: true }, 'a@b.co', msg)).toBeNull()
  })

  it('allows only safe redirects', () => {
    expect(safeFormRedirect('/thanks')).toBe('/thanks')
    expect(safeFormRedirect('https://example.com/x')).toMatch(/^https:/)
    expect(safeFormRedirect('javascript:alert(1)')).toBeNull()
    expect(safeFormRedirect('//evil.com')).toBeNull()
    expect(safeFormRedirect('/\\evil.com')).toBeNull()
  })
})

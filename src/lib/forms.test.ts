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
  })
})

describe('server-side submission check', async () => {
  const { checkSubmission, inquiryPrefill, MAX_LENGTH } = await import('./forms')
  const form = {
    id: '0a7f1c6e-2222-4a2b-8c3d-000000000020',
    fields: [
      { blockType: 'text', name: 'name', required: true },
      { blockType: 'email', name: 'email', required: true },
      { blockType: 'textarea', name: 'message', required: true },
      { blockType: 'message', message: null },
    ],
  }
  const ok = [
    { field: 'name', value: ' Sara ' },
    { field: 'email', value: 'sara@example.com' },
    { field: 'message', value: 'Hello' },
  ]

  it('forwards only the form’s own fields, trimmed, in form order', () => {
    const result = checkSubmission(form, { submissionData: [ok[2], ok[0], ok[1]] })
    expect(result).toEqual({
      ok: true,
      submission: {
        form: form.id,
        submissionData: [
          { field: 'name', value: 'Sara' },
          { field: 'email', value: 'sara@example.com' },
          { field: 'message', value: 'Hello' },
        ],
      },
    })
  })

  it('rejects a crafted request that skips a required field or breaks a rule', () => {
    expect(checkSubmission(form, { submissionData: [ok[0]] })).toMatchObject({
      ok: false,
      status: 422,
      fields: { email: 'required', message: 'required' },
    })
    expect(checkSubmission(form, { submissionData: [ok[0], { field: 'email', value: 'nope' }, ok[2]] })).toMatchObject({
      status: 422,
      fields: { email: 'invalidEmail' },
    })
    const long = 'x'.repeat(MAX_LENGTH.textarea + 1)
    expect(checkSubmission(form, { submissionData: [ok[0], ok[1], { field: 'message', value: long }] })).toMatchObject({
      fields: { message: 'tooLong' },
    })
  })

  it('refuses undeclared, duplicated and non-scalar fields', () => {
    expect(checkSubmission(form, { submissionData: [...ok, { field: 'site', value: 'other-tenant' }] })).toMatchObject({ status: 400, error: 'unknown-field' })
    expect(checkSubmission(form, { submissionData: [...ok, ok[0]] })).toMatchObject({ status: 400, error: 'duplicate-field' })
    expect(checkSubmission(form, { submissionData: [{ field: 'name', value: { $ne: 1 } }] })).toMatchObject({ status: 400, error: 'invalid-value' })
    expect(checkSubmission(form, { submissionData: 'x' })).toMatchObject({ status: 400 })
    expect(checkSubmission(form, null)).toMatchObject({ status: 400 })
  })

  it('blocks open redirects through backslashes', () => {
    expect(safeFormRedirect('/\\evil.com')).toBeNull()
    expect(safeFormRedirect(' /thanks ')).toBe('/thanks')
  })

  it('turns a project title into a plain, bounded opening line', () => {
    expect(inquiryPrefill('Sea House', 'en')).toBe('About the project “Sea House”:')
    expect(inquiryPrefill(['<b>Sea</b>\u0000 House'], 'en')).toBe('About the project “bSea/b House”:')
    expect(inquiryPrefill('x'.repeat(500), 'en')!.length).toBeLessThan(160)
    expect(inquiryPrefill(undefined, 'fa')).toBeUndefined()
    expect(inquiryPrefill('   ', 'fa')).toBeUndefined()
  })
})

import { copy, interpolate } from '@/lib/i18n'
import { isSafeLocalPath } from '@/lib/links'
import type { Form, FormField, Locale } from '@/lib/types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Longest value a field may carry: a message box gets room, everything else a line. */
export const MAX_LENGTH = { textarea: 5000, other: 500 } as const

export type FieldErrorCode = 'required' | 'invalidEmail' | 'invalidNumber' | 'tooLong'

/** The one field rule, shared by the browser (for instant feedback) and the server route (for truth). */
export function fieldError(field: FormField, value: string): FieldErrorCode | null {
  const empty = field.blockType === 'checkbox' ? value !== 'true' : !value.trim()
  if (field.required && empty) return 'required'
  if (!value.trim()) return null
  if (value.length > (field.blockType === 'textarea' ? MAX_LENGTH.textarea : MAX_LENGTH.other)) return 'tooLong'
  if (field.blockType === 'email' && !EMAIL.test(value.trim())) return 'invalidEmail'
  if (field.blockType === 'number' && Number.isNaN(Number(value))) return 'invalidNumber'
  return null
}

export function validateFormField(
  field: FormField,
  value: string,
  messages: { required: string; invalidEmail: string; invalidNumber: string; tooLong?: string },
): string | null {
  const code = fieldError(field, value)
  if (!code) return null
  return code === 'tooLong' ? messages.tooLong ?? messages.required : messages[code]
}

/** Fields a visitor fills in; `message` blocks are prose inside the form. */
export const inputFields = (form: Pick<Form, 'fields'>): (FormField & { name: string })[] =>
  (form.fields ?? []).filter((f): f is FormField & { name: string } => f.blockType !== 'message' && Boolean(f.name))

export type Submission = { form: string; submissionData: { field: string; value: string }[] }

export type SubmissionCheck =
  | { ok: true; submission: Submission }
  | { ok: false; status: 400 | 422; error: string; fields?: Record<string, FieldErrorCode> }

/**
 * Validates a visitor's submission against the form the CMS actually defines. The browser
 * runs the same field rule for feedback, but this is the check that counts: a crafted
 * request cannot skip a required field, smuggle fields the form does not have, or send
 * an oversized value. Only the form's own fields are forwarded, as strings.
 */
export function checkSubmission(form: Form, body: unknown): SubmissionCheck {
  if (!body || typeof body !== 'object') return { ok: false, status: 400, error: 'invalid-body' }
  const { submissionData } = body as { submissionData?: unknown }
  if (!Array.isArray(submissionData)) return { ok: false, status: 400, error: 'invalid-body' }

  const fields = inputFields(form)
  const known = new Map(fields.map((f) => [f.name, f]))
  const values = new Map<string, string>()
  for (const entry of submissionData) {
    if (!entry || typeof entry !== 'object') return { ok: false, status: 400, error: 'invalid-body' }
    const { field, value } = entry as { field?: unknown; value?: unknown }
    if (typeof field !== 'string' || !known.has(field)) return { ok: false, status: 400, error: 'unknown-field' }
    if (values.has(field)) return { ok: false, status: 400, error: 'duplicate-field' }
    if (value !== undefined && value !== null && typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
      return { ok: false, status: 400, error: 'invalid-value' }
    }
    values.set(field, value === undefined || value === null ? '' : String(value))
  }

  const errors: Record<string, FieldErrorCode> = {}
  for (const field of fields) {
    const code = fieldError(field, values.get(field.name) ?? '')
    if (code) errors[field.name] = code
  }
  if (Object.keys(errors).length) return { ok: false, status: 422, error: 'invalid-fields', fields: errors }

  return {
    ok: true,
    submission: {
      form: form.id,
      submissionData: fields.filter((f) => values.has(f.name)).map((f) => ({ field: f.name, value: values.get(f.name)!.trim() })),
    },
  }
}

/** Only same-origin paths or http(s) redirects from CMS confirmation settings. */
export function safeFormRedirect(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('/')) return isSafeLocalPath(trimmed) ? trimmed : null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

/**
 * The opening line of an inquiry that came from a project page (`/contact?project=…`):
 * the title as plain text, bounded, without markup or control characters. It only ever
 * fills the visitor's own message box, which they can edit or clear before sending.
 */
export function inquiryPrefill(value: string | string[] | undefined, locale: Locale): string | undefined {
  const raw = (Array.isArray(value) ? value[0] : value)?.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, 120)
  return raw ? interpolate(copy[locale].inquiryPrefill, { title: raw }) : undefined
}

import type { FormField } from '@/lib/types'

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function validateFormField(
  field: FormField,
  value: string,
  messages: { required: string; invalidEmail: string; invalidNumber: string },
): string | null {
  const empty = field.blockType === 'checkbox' ? value !== 'true' : !value.trim()
  if (field.required && empty) return messages.required
  if (!value.trim()) return null
  if (field.blockType === 'email' && !EMAIL.test(value.trim())) return messages.invalidEmail
  if (field.blockType === 'number' && Number.isNaN(Number(value))) return messages.invalidNumber
  return null
}

/** Only same-origin paths or http(s) redirects from CMS confirmation settings. */
export function safeFormRedirect(url: string | null | undefined): string | null {
  if (!url) return null
  const trimmed = url.trim()
  if (trimmed.startsWith('/') && !trimmed.startsWith('//') && !trimmed.startsWith('/\\')) return trimmed
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return null
}

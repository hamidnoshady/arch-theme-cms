'use client'

import { useId, useRef, useState } from 'react'

import { copy } from '@/lib/i18n'
import type { Form, FormField, Locale } from '@/lib/types'

type Status = 'idle' | 'sending' | 'success' | 'failure'
type Errors = Record<string, string>

const INPUT_TYPES: Record<string, string> = { text: 'text', email: 'email', number: 'number', country: 'text', state: 'text' }
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(field: FormField, value: string, t: (typeof copy)['fa']): string | null {
  const empty = field.blockType === 'checkbox' ? value !== 'true' : !value.trim()
  if (field.required && empty) return t.required
  if (!value.trim()) return null
  if (field.blockType === 'email' && !EMAIL.test(value.trim())) return t.invalidEmail
  if (field.blockType === 'number' && Number.isNaN(Number(value))) return t.invalidNumber
  return null
}

function safeRedirect(url: string | null | undefined): string | null {
  if (!url) return null
  return url.startsWith('/') || /^https?:\/\//i.test(url) ? url : null
}

/**
 * Renders a Payload form-builder form and posts to `/api/form-submissions` on
 * this origin (proxied to the CMS). The CMS derives the tenant from the form,
 * never from this request.
 */
export function CmsForm({
  form,
  locale,
  messages = {},
  confirmation,
}: {
  form: Form
  locale: Locale
  /** Server-rendered `message` field bodies, keyed by field index. */
  messages?: Record<number, React.ReactNode>
  confirmation?: React.ReactNode
}) {
  const t = copy[locale]
  const uid = useId()
  const formRef = useRef<HTMLFormElement>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errors, setErrors] = useState<Errors>({})
  const [touched, setTouched] = useState(false)
  const fields = (form.fields ?? []).filter((f) => f.blockType === 'message' || f.name)

  const read = (el: HTMLFormElement, field: FormField) => {
    const control = el.elements.namedItem(field.name!) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null
    if (!control) return ''
    if (control instanceof HTMLInputElement && control.type === 'checkbox') return control.checked ? 'true' : 'false'
    return control.value
  }

  const check = (el: HTMLFormElement) => {
    const next: Errors = {}
    for (const field of fields) {
      if (field.blockType === 'message') continue
      const error = validate(field, read(el, field), t)
      if (error) next[field.name!] = error
    }
    setErrors(next)
    return next
  }

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const el = e.currentTarget
    setTouched(true)
    const found = check(el)
    const first = Object.keys(found)[0]
    if (first) {
      ;(el.elements.namedItem(first) as HTMLElement | null)?.focus()
      return
    }
    if ((el.elements.namedItem('company') as HTMLInputElement | null)?.value) {
      setStatus('success')
      return
    }

    setStatus('sending')
    try {
      const submissionData = fields
        .filter((f) => f.blockType !== 'message')
        .map((f) => ({ field: f.name!, value: read(el, f) }))
      const res = await fetch('/api/form-submissions', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ form: form.id, submissionData }),
      })
      if (!res.ok) throw new Error(String(res.status))
      const redirect = form.confirmationType === 'redirect' ? safeRedirect(form.redirect?.url) : null
      if (redirect) {
        window.location.assign(redirect)
        return
      }
      setStatus('success')
      el.reset()
    } catch {
      setStatus('failure')
    }
  }

  if (status === 'success') {
    return (
      <div className="form-status form-status--success" role="status" tabIndex={-1} ref={(n) => n?.focus()}>
        <span className="rule rule--marked" aria-hidden="true" />
        {confirmation ?? <p>{t.success}</p>}
      </div>
    )
  }

  return (
    <form
      ref={formRef}
      className="form"
      noValidate
      onSubmit={onSubmit}
      onBlur={() => touched && formRef.current && check(formRef.current)}
      aria-busy={status === 'sending'}
    >
      <div className="form__hp" aria-hidden="true">
        <label>
          Company
          <input type="text" name="company" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <div className="form__grid">
        {fields.map((field, i) => {
          if (field.blockType === 'message') {
            return messages[i] ? (
              <div key={field.id ?? i} className="form__message form__cell--full">
                {messages[i]}
              </div>
            ) : null
          }
          const id = `${uid}-${field.name}`
          const errorId = `${id}-error`
          const error = errors[field.name!]
          const width = field.width && field.width <= 50 ? 'half' : 'full'
          const label = field.label || field.name
          const describedBy = error ? errorId : undefined
          const common = {
            id,
            name: field.name!,
            required: Boolean(field.required),
            'aria-invalid': error ? true : undefined,
            'aria-describedby': describedBy,
          }

          if (field.blockType === 'checkbox') {
            return (
              <div key={field.id ?? i} className="form__cell form__cell--full field field--checkbox">
                <input type="checkbox" {...common} defaultChecked={Boolean(field.defaultValue)} />
                <label htmlFor={id}>
                  {label}
                  {!field.required ? <span className="field__optional"> — {t.optional}</span> : null}
                </label>
                {error ? (
                  <p className="field__error" id={errorId}>
                    {error}
                  </p>
                ) : null}
              </div>
            )
          }

          return (
            <div key={field.id ?? i} className={`form__cell form__cell--${width} field`}>
              <label className="field__label" htmlFor={id}>
                <span>{label}</span>
                {!field.required ? <span className="field__optional">{t.optional}</span> : null}
              </label>
              {field.blockType === 'textarea' ? (
                <textarea className="field__control" rows={5} {...common} defaultValue={String(field.defaultValue ?? '')} />
              ) : field.blockType === 'select' ? (
                <select className="field__control" {...common} defaultValue={String(field.defaultValue ?? '')}>
                  <option value="">—</option>
                  {(field.options ?? []).map((o) => (
                    <option key={o.id ?? o.value} value={o.value}>
                      {o.label ?? o.value}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  className="field__control"
                  type={INPUT_TYPES[field.blockType] ?? 'text'}
                  inputMode={field.blockType === 'number' ? 'decimal' : undefined}
                  autoComplete={field.blockType === 'email' ? 'email' : field.name === 'name' ? 'name' : undefined}
                  dir={field.blockType === 'email' || field.blockType === 'number' ? 'ltr' : undefined}
                  {...common}
                  defaultValue={String(field.defaultValue ?? '')}
                />
              )}
              {error ? (
                <p className="field__error" id={errorId}>
                  {error}
                </p>
              ) : null}
            </div>
          )
        })}
      </div>

      <div className="form__actions">
        <button type="submit" className="button" disabled={status === 'sending'}>
          <span>{status === 'sending' ? t.sending : form.submitButtonLabel || t.send}</span>
          <span className="arrow" aria-hidden="true" />
        </button>
        <p className="form__live" role="status" aria-live="polite">
          {status === 'failure' ? <span className="field__error">{t.failure}</span> : null}
        </p>
      </div>
    </form>
  )
}

'use client'

import Link from 'next/link'

import { Logo } from '@/components/brand/Logo'
import { copy, href } from '@/lib/i18n'
import type { Locale } from '@/lib/types'

/** Self-contained (no CMS calls) so it renders even when the CMS is unreachable. */
export function StatusView({
  locale,
  code,
  title,
  body,
  action,
}: {
  locale: Locale
  code?: string
  title: string
  body: string
  action?: React.ReactNode
}) {
  const t = copy[locale]
  return (
    <main className="status-page">
      <Link href={href(locale)} className="status-page__brand" aria-label={t.home}>
        <Logo variant="compact" />
      </Link>
      <div className="status-page__body">
        <span className="rule rule--marked" aria-hidden="true" />
        {code ? <p className="num status-page__code">{code}</p> : null}
        <h1 className="status-page__title">{title}</h1>
        <p className="muted">{body}</p>
        <div className="status-page__actions">
          {action}
          <Link className="text-link" href={href(locale)}>
            {t.home} <span className="arrow" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </main>
  )
}

export function NotFoundView({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return <StatusView locale={locale} code={locale === 'fa' ? '۴۰۴' : '404'} title={t.notFoundTitle} body={t.notFoundBody} />
}

export function ErrorView({ locale, reset }: { locale: Locale; reset: () => void }) {
  const t = copy[locale]
  return (
    <StatusView
      locale={locale}
      title={t.errorTitle}
      body={t.errorBody}
      action={
        <button type="button" className="button" onClick={reset}>
          {t.retry}
        </button>
      }
    />
  )
}

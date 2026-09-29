'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import { Logo } from '@/components/brand/Logo'
import { copy, otherLocale } from '@/lib/i18n'
import type { ResolvedBranding } from '@/lib/theme/branding'
import type { Locale, LocaleLink } from '@/lib/types'

type Item = {
  key: string
  href: string
  label: string
  number: string
  current: boolean
  external?: boolean
  newTab?: boolean
}

/** Small-screen navigation as a native modal dialog: focus trap, Escape and inert page for free. */
export function MobileMenu({
  locale,
  items,
  language,
  branding,
}: {
  locale: Locale
  branding: ResolvedBranding
  items: Item[]
  language: LocaleLink | null
}) {
  const t = copy[locale]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // A short, one-way entrance: the panel class flips after commit so the CSS
  // transition plays exactly once per open. Reduced motion sees the final state
  // immediately (media query in chrome.css).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!open || !dialog) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (mq.matches) return
    const id = requestAnimationFrame(() => dialog.setAttribute('data-enter', 'in'))
    return () => {
      cancelAnimationFrame(id)
      dialog.removeAttribute('data-enter')
    }
  }, [open])

  const target = otherLocale(locale)

  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span className="menu-button__icon" aria-hidden="true" />
        <span>{t.menu}</span>
      </button>

      <dialog
        ref={dialogRef}
        className="menu-panel"
        aria-label={t.primaryNav}
        onClose={() => setOpen(false)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setOpen(false)
        }}
      >
        <div className="menu-panel__inner">
          <div className="menu-panel__top">
            <Logo variant="compact" branding={branding} />
            <button type="button" className="menu-panel__close text-link" onClick={() => setOpen(false)}>
              {t.close}
            </button>
          </div>

          <nav aria-label={t.primaryNav}>
            <ol className="menu-panel__list">
              {items.map((item, i) => (
                <li key={item.key}>
                  {item.external ? (
                    <a
                      className="menu-panel__link"
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      style={{ ['--menu-i' as string]: i }}
                      {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <span className="menu-panel__number" aria-hidden="true">
                        {item.number}
                      </span>
                      <span>{item.label}</span>
                    </a>
                  ) : (
                    <Link
                      className="menu-panel__link"
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                      style={{ ['--menu-i' as string]: i }}
                    >
                      <span className="menu-panel__number" aria-hidden="true">
                        {item.number}
                      </span>
                      <span>{item.label}</span>
                    </Link>
                  )}
                </li>
              ))}
            </ol>
          </nav>

          {language ? (
            <div className="menu-panel__foot">
              <Link
                className="lang-switch"
                href={language.href}
                hrefLang={target}
                lang={target}
                data-available={language.available}
              >
                {t.switchTo}
              </Link>
              {!language.available ? <p className="menu-panel__note">{t.switchUnavailable}</p> : null}
            </div>
          ) : null}
        </div>
      </dialog>
    </>
  )
}

'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import { Logo } from '@/components/brand/Logo'
import { copy, otherLocale } from '@/lib/i18n'
import type { ResolvedBranding } from '@/lib/theme/branding'
import type { Locale, LocaleLink } from '@/lib/types'

/**
 * `leaving` keeps the panel in the top layer while the shell slides back from
 * under it — dropping it at the same instant as the push starts is a hard cut.
 */
type Phase = 'closed' | 'open' | 'leaving'

type Item = {
  key: string
  href: string
  label: string
  number: string
  current: boolean
  external?: boolean
  newTab?: boolean
}

/**
 * The push and the panel animate on the same token, so JS needs that clock to
 * know when the shell has landed. Read from CSS rather than repeating it here.
 */
function entranceMs(): number {
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--entrance-dur').trim()
  const value = Number.parseFloat(raw)
  if (!Number.isFinite(value)) return 400
  return raw.endsWith('ms') ? value : value * 1000
}

const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches

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
  const [phase, setPhase] = useState<Phase>('closed')
  const exit = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (phase === 'closed') {
      if (dialog.open) dialog.close()
      dialog.removeAttribute('data-enter')
      return
    }
    if (!dialog.open) {
      // Claim the entrance's starting state before the panel is first painted, so
      // the transition in chrome.css has something to travel from.
      dialog.setAttribute('data-enter', '')
      dialog.showModal()
    }
  }, [phase])

  // One class per direction, flipped after commit so the CSS transition plays
  // exactly once. Reduced motion sees the final state immediately (chrome.css).
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog || phase === 'closed') return
    const id = requestAnimationFrame(() => {
      // Commit the pre-flight state as the transition's "from" value: a forced
      // style read, because the browser may otherwise never see it when the panel
      // is shown and flipped inside one rendering update.
      void dialog.offsetWidth
      dialog.setAttribute('data-enter', phase === 'leaving' ? 'out' : 'in')
    })
    return () => cancelAnimationFrame(id)
  }, [phase])

  // The push: while the drawer is open the entire shell slides aside by the
  // drawer's own width (chrome.css), so the page is displaced rather than covered.
  useEffect(() => {
    const root = document.documentElement
    if (phase === 'open') root.dataset.menu = 'open'
    else delete root.dataset.menu
    return () => {
      delete root.dataset.menu
    }
  }, [phase])

  useEffect(() => () => clearTimeout(exit.current), [])

  /** Close at once — for navigation, where waiting would delay the page change. */
  const closeNow = useCallback(() => {
    clearTimeout(exit.current)
    setPhase('closed')
  }, [])

  /** Close with the exit: the shell slides back first, the panel is dropped after. */
  const close = useCallback(() => {
    clearTimeout(exit.current)
    if (reducedMotion()) {
      setPhase('closed')
      return
    }
    setPhase('leaving')
    exit.current = setTimeout(() => setPhase('closed'), entranceMs())
  }, [])

  /*
   * Escape arrives as the dialog's native `cancel`, which does not bubble and so
   * never reaches a React handler. Prevented here and routed through the same exit,
   * or the panel would be dropped while the page is still offset.
   */
  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    const onCancel = (event: Event) => {
      event.preventDefault()
      close()
    }
    dialog.addEventListener('cancel', onCancel)
    return () => dialog.removeEventListener('cancel', onCancel)
  }, [close])

  const target = otherLocale(locale)

  return (
    <>
      <button
        type="button"
        className="menu-button"
        aria-label={t.openMenu}
        aria-haspopup="dialog"
        aria-expanded={phase !== 'closed'}
        onClick={() => {
          clearTimeout(exit.current)
          setPhase('open')
        }}
      >
        <span className="menu-button__icon" aria-hidden="true" />
      </button>

      <dialog
        ref={dialogRef}
        className="menu-panel"
        aria-label={t.primaryNav}
        onClose={closeNow}
        onClick={(e) => {
          if (e.target === e.currentTarget) close()
        }}
      >
        <div className="menu-panel__inner">
          <div className="menu-panel__top">
            <Logo variant="compact" branding={branding} />
            <button type="button" className="menu-panel__close" aria-label={t.closeMenu} onClick={close}>
              <span className="menu-panel__close-icon" aria-hidden="true" />
            </button>
          </div>

          <nav aria-label={t.primaryNav}>
            <ol className="menu-panel__list">
              {items.map((item) => (
                <li key={item.key}>
                  {item.external ? (
                    <a
                      className="menu-panel__link"
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={closeNow}
                      {...(item.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                    >
                      <span className="menu-panel__number" aria-hidden="true">
                        {item.number}
                      </span>
                      <span>
                        {item.label}
                        <span className="arrow arrow--external" aria-hidden="true" />
                      </span>
                    </a>
                  ) : (
                    <Link
                      className="menu-panel__link"
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      onClick={closeNow}
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
                onClick={closeNow}
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

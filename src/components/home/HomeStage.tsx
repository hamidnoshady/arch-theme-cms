'use client'

import Link from 'next/link'
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { Logo } from '@/components/brand/Logo'
import { copy } from '@/lib/i18n'
import type { ResolvedBranding } from '@/lib/theme/branding'
import type { Locale } from '@/lib/types'

export type HomeNavItem = { href: string; label: string; number: string }

type Props = {
  locale: Locale
  items: HomeNavItem[]
  /** The Projects destination, offered from the first frame — before and during the intro. */
  shortcut?: { href: string; label: string } | null
  language: { href: string; label: string; short: string; lang: Locale } | null
  branding: ResolvedBranding
  mediaOrigin?: string
  introDurationMs?: number
  introAnimation?: boolean
}

/** Pixels of wheel travel for a full reveal; one mouse-wheel notch (~100px) is enough to commit. */
const WHEEL_RANGE = 380
const DEFAULT_INTRO_MS = 2500
/** Follow time-constants (ms) of the progress spring: tight while a finger/wheel drives it, softer when it settles. */
const TAU_DRAG = 70
const TAU_SETTLE = 150
const REVEAL_KEYS = new Set(['ArrowDown', 'PageDown', 'End'])
const COLLAPSE_KEYS = new Set(['ArrowUp', 'PageUp', 'Home', 'Escape'])

const clamp = (v: number) => Math.min(1, Math.max(0, v))
const useIsoLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect

/**
 * The single-screen entrance. One bounded interaction: a progress value `--p`
 * (0 = logo alone, 1 = navigation revealed) driven by wheel, touch, keyboard or
 * the cue button. The page itself never scrolls.
 *
 * `--p` is eased toward a target by one requestAnimationFrame loop (exponential
 * smoothing), so wheel notches, touch drags and button presses all glide the
 * same way. The stylesheet consumes `--p` in transforms and opacity only — no
 * layout property moves during the gesture.
 */
export function HomeStage({
  locale,
  items,
  shortcut = null,
  language,
  branding,
  mediaOrigin = '',
  introDurationMs,
  introAnimation = true,
}: Props) {
  const INTRO_MS = introDurationMs ?? DEFAULT_INTRO_MS
  const t = copy[locale]
  const stageRef = useRef<HTMLDivElement>(null)
  const navRef = useRef<HTMLElement>(null)
  const listRef = useRef<HTMLOListElement>(null)
  const ruleRef = useRef<HTMLSpanElement>(null)
  const cueRef = useRef<HTMLButtonElement>(null)
  const progress = useRef(0)
  const target = useRef(0)
  const tau = useRef(TAU_SETTLE)
  const frame = useRef(0)
  const lastFrame = useRef(0)
  const direction = useRef(0)
  const settleTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const reduced = useRef(false)
  const [revealed, setRevealed] = useState(false)
  const [introActive, setIntroActive] = useState(false)

  const paint = useCallback((value: number) => {
    progress.current = value
    stageRef.current?.style.setProperty('--p', value.toFixed(4))
  }, [])

  /** Ease `--p` toward `value`; `follow` is the smoothing time-constant in ms. */
  const run = useCallback(
    (value: number, follow: number) => {
      target.current = clamp(value)
      tau.current = follow
      if (reduced.current) {
        paint(target.current)
        return
      }
      if (frame.current) return
      lastFrame.current = performance.now()
      const step = (now: number) => {
        const dt = Math.min(64, now - lastFrame.current)
        lastFrame.current = now
        const diff = target.current - progress.current
        if (Math.abs(diff) < 0.0008) {
          paint(target.current)
          frame.current = 0
          return
        }
        paint(progress.current + diff * (1 - Math.exp(-dt / tau.current)))
        frame.current = requestAnimationFrame(step)
      }
      frame.current = requestAnimationFrame(step)
    },
    [paint],
  )

  useEffect(() => () => cancelAnimationFrame(frame.current), [])

  const finishIntro = useCallback(() => {
    const root = document.documentElement
    if (root.dataset.intro === 'play') root.dataset.intro = 'done'
  }, [])

  const settle = useCallback(
    (value: 0 | 1) => {
      run(value, TAU_SETTLE)
      setRevealed(value === 1)
    },
    [run],
  )

  const moveIndicator = useCallback((item: HTMLElement | null) => {
    const nav = listRef.current
    const stage = stageRef.current
    if (!nav || !stage || !item) return
    const a = (ruleRef.current ?? nav).getBoundingClientRect()
    const b = item.getBoundingClientRect()
    const rtl = getComputedStyle(nav).direction === 'rtl'
    const x = rtl ? a.right - b.right : b.left - a.left
    stage.style.setProperty('--indicator-x', `${Math.round(x)}px`)
    stage.style.setProperty('--indicator-w', `${Math.round(b.width)}px`)
  }, [])

  const resetIndicator = useCallback(() => {
    moveIndicator(listRef.current?.querySelector<HTMLElement>('li') ?? null)
  }, [moveIndicator])

  // Intro state is decided before paint by the inline script in HomeView.
  useIsoLayoutEffect(() => {
    const root = document.documentElement
    setIntroActive(root.dataset.intro === 'play')
    reduced.current = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.intro === 'reduced'
    if (reduced.current) {
      settle(1)
      return
    }
    if (root.dataset.intro === 'play') {
      const id = setTimeout(finishIntro, INTRO_MS)
      return () => clearTimeout(id)
    }
  }, [INTRO_MS, finishIntro, settle])

  const measureNav = useCallback(() => {
    const nav = navRef.current
    const stage = stageRef.current
    if (!nav || !stage) return
    const full = nav.offsetHeight
    if (full > 0) stage.style.setProperty('--nav-h', `${full}px`)
    resetIndicator()
  }, [resetIndicator])

  useEffect(() => {
    measureNav()
    addEventListener('resize', measureNav)
    return () => removeEventListener('resize', measureNav)
  }, [measureNav])

  useIsoLayoutEffect(() => {
    const nav = navRef.current
    if (!nav) return
    const hidden = !revealed && !reduced.current
    nav.toggleAttribute('inert', hidden)
    if (hidden) nav.setAttribute('aria-hidden', 'true')
    else nav.removeAttribute('aria-hidden')
  }, [revealed])

  useEffect(() => {
    if (!reduced.current) return
    const mq = matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => (reduced.current = mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    const pickTarget = (): 0 | 1 => {
      const p = target.current
      return direction.current > 0 ? (p > 0.12 ? 1 : 0) : p < 0.88 ? 0 : 1
    }
    const scheduleSettle = () => {
      clearTimeout(settleTimer.current)
      settleTimer.current = setTimeout(() => settle(pickTarget()), 140)
    }

    const onWheel = (e: WheelEvent) => {
      if (reduced.current || e.ctrlKey) return
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? innerHeight : 1
      const dy = e.deltaY * unit
      if (!dy) return
      finishIntro()
      direction.current = Math.sign(dy)
      run(target.current + dy / WHEEL_RANGE, TAU_DRAG)
      scheduleSettle()
    }

    let startY = 0
    let startP = 0
    let moved = false
    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return
      startY = e.touches[0]!.clientY
      startP = target.current
      moved = false
    }
    const onTouchMove = (e: TouchEvent) => {
      if (reduced.current || e.touches.length !== 1) return
      const dy = startY - e.touches[0]!.clientY
      if (!moved && Math.abs(dy) < 8) return
      moved = true
      finishIntro()
      direction.current = Math.sign(dy)
      run(startP + dy / (innerHeight * 0.28), TAU_DRAG / 2)
    }
    const onTouchEnd = () => {
      if (!moved) return
      moved = false
      settle(pickTarget())
    }

    addEventListener('wheel', onWheel, { passive: true })
    addEventListener('touchstart', onTouchStart, { passive: true })
    addEventListener('touchmove', onTouchMove, { passive: true })
    addEventListener('touchend', onTouchEnd, { passive: true })
    addEventListener('touchcancel', onTouchEnd, { passive: true })
    return () => {
      clearTimeout(settleTimer.current)
      removeEventListener('wheel', onWheel)
      removeEventListener('touchstart', onTouchStart)
      removeEventListener('touchmove', onTouchMove)
      removeEventListener('touchend', onTouchEnd)
      removeEventListener('touchcancel', onTouchEnd)
    }
  }, [run, finishIntro, settle])

  const collapse = useCallback(() => {
    if (reduced.current) return
    const focusInNav = navRef.current?.contains(document.activeElement)
    settle(0)
    if (focusInNav) cueRef.current?.focus()
  }, [settle])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey) return
      const target = e.target as HTMLElement | null
      const onControl = Boolean(target?.closest('a, button, input, select, textarea'))
      if (REVEAL_KEYS.has(e.key) || (e.key === ' ' && !onControl)) {
        e.preventDefault()
        finishIntro()
        if (!revealed) settle(1)
        return
      }
      if (COLLAPSE_KEYS.has(e.key) && revealed) {
        e.preventDefault()
        collapse()
        return
      }
      if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && navRef.current?.contains(target)) {
        const links = [...navRef.current.querySelectorAll<HTMLAnchorElement>('a')]
        const index = links.indexOf(target as HTMLAnchorElement)
        if (index < 0) return
        const forward = (e.key === 'ArrowRight') === (document.dir !== 'rtl')
        const next = links[(index + (forward ? 1 : -1) + links.length) % links.length]
        e.preventDefault()
        next?.focus()
      }
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [collapse, finishIntro, revealed, settle])

  const onCue = (e: React.MouseEvent<HTMLButtonElement>) => {
    finishIntro()
    if (revealed) {
      collapse()
      return
    }
    settle(1)
    // Keyboard activation (detail 0) moves focus into the revealed navigation.
    if (e.detail === 0) {
      requestAnimationFrame(() => navRef.current?.querySelector<HTMLAnchorElement>('a')?.focus())
    }
  }

  const onSkip = () => {
    finishIntro()
    cueRef.current?.focus()
  }

  return (
    <div
      ref={stageRef}
      className="home"
      data-revealed={revealed ? 'true' : 'false'}
    >
      <div className="home__grid" aria-hidden="true">
        <span className="home__line home__line--v" />
        <span className="home__line home__line--h" />
      </div>

      <div className="home__top">
        <button type="button" className="home__skip text-link" onClick={onSkip}>
          {t.skip}
        </button>
        {shortcut ? (
          <Link className="home__shortcut text-link" href={shortcut.href}>
            {shortcut.label} <span className="arrow" aria-hidden="true" />
          </Link>
        ) : null}
        {language ? (
          <Link className="home__lang lang-switch" href={language.href} hrefLang={language.lang} lang={language.lang}>
            <span aria-hidden="true">{language.short}</span>
            <span className="sr-only">{language.label}</span>
          </Link>
        ) : null}
      </div>

      <div className="home__center">
        <div className="home__stack">
          <h1 className="home__brand">
            <Logo
              variant="full"
              animated={introAnimation && introActive}
              className="home__logo"
              branding={branding}
              mediaOrigin={mediaOrigin}
              label={branding.brandLabel}
            />
            <span className="sr-only">{t.brand}</span>
          </h1>

          <nav
            ref={(node) => {
              navRef.current = node
              if (node) measureNav()
            }}
            id="home-nav"
            className="home__nav"
            aria-label={t.primaryNav}
            onMouseLeave={resetIndicator}
          >
            <span ref={ruleRef} className="home__rule" aria-hidden="true">
              <span className="home__indicator" />
            </span>
            <ol ref={listRef} className="home__list">
              {items.map((item) => (
                <li
                  key={item.href}
                  onMouseEnter={(e) => moveIndicator(e.currentTarget)}
                  onFocus={(e) => moveIndicator(e.currentTarget)}
                >
                  <Link className="home__link" href={item.href}>
                    <span className="home__number">{item.number}</span>
                    <span className="home__label">{item.label}</span>
                  </Link>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      <button
        ref={cueRef}
        type="button"
        className="home__cue"
        aria-controls="home-nav"
        aria-expanded={revealed}
        onClick={onCue}
      >
        <span className="home__cue-line" aria-hidden="true" />
        <span className="home__cue-label" aria-hidden="true">
          {t.scroll}
        </span>
        <span className="sr-only">{revealed ? t.hideMenu : t.revealMenu}</span>
      </button>
    </div>
  )
}

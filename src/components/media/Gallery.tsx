'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { copy, interpolate } from '@/lib/i18n'
import type { ResolvedMedia } from '@/lib/media'
import { toLocaleDigits } from '@eshobe/site-runtime'
import type { Locale } from '@/lib/types'

import { MediaFrame } from './MediaFrame'
import { Picture } from './Picture'

/** Index after a key press, or null for keys the viewer does not handle. RTL mirrors the arrows. */
export function stepForKey(key: string, index: number, count: number, rtl: boolean): number | null {
  if (count < 1) return null
  if (key === 'Home') return 0
  if (key === 'End') return count - 1
  if (key !== 'ArrowLeft' && key !== 'ArrowRight') return null
  const forward = (key === 'ArrowRight') !== rtl
  return (index + (forward ? 1 : -1) + count) % count
}

/**
 * A grid of images that opens into a full-screen viewer. The viewer is a modal
 * `<dialog>`: focus stays inside it, Escape closes it, and focus returns to the
 * thumbnail that opened it. Previous/next are labelled buttons with the neighbour's
 * description, a counter announces position, and arrow keys follow the reading
 * direction (in Persian, → goes back).
 */
export function Gallery({
  images,
  locale,
  columns = 2,
}: {
  images: ResolvedMedia[]
  locale: Locale
  columns?: number
}) {
  const t = copy[locale]
  const dialogRef = useRef<HTMLDialogElement>(null)
  const triggers = useRef<(HTMLButtonElement | null)[]>([])
  const opener = useRef<number | null>(null)
  const [index, setIndex] = useState<number | null>(null)
  const count = images.length
  const cols = Math.min(Math.max(columns, 1), 4)

  const go = useCallback(
    (step: number) => setIndex((i) => (i === null ? i : (i + step + count) % count)),
    [count],
  )

  const open = (i: number) => {
    opener.current = i
    setIndex(i)
  }

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (index !== null && !dialog.open) {
      dialog.showModal()
      document.documentElement.dataset.viewer = 'open'
    }
    if (index === null && dialog.open) dialog.close()
  }, [index])

  // Closing by any path (button, Escape, backdrop) lands here: unlock the page and give
  // focus back to the thumbnail the visitor came from.
  const onClose = () => {
    delete document.documentElement.dataset.viewer
    setIndex(null)
    const from = opener.current
    opener.current = null
    if (from !== null) requestAnimationFrame(() => triggers.current[from]?.focus())
  }

  useEffect(() => () => void delete document.documentElement.dataset.viewer, [])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      const next = stepForKey(e.key, index, count, document.documentElement.dir === 'rtl')
      if (next === null) return
      e.preventDefault()
      setIndex(next)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [index, count])

  const touchX = useRef<number | null>(null)
  const current = index === null ? null : images[index]
  const previous = index === null ? null : images[(index - 1 + count) % count]
  const next = index === null ? null : images[(index + 1) % count]
  const counter = (n: number) =>
    interpolate(t.imageOf, { n: toLocaleDigits(String(n + 1), locale), total: toLocaleDigits(String(count), locale) })
  const describe = (image: ResolvedMedia | null | undefined, n: number) => (image?.alt ? `${image.alt} — ${counter(n)}` : counter(n))

  if (!count) return null

  return (
    <>
      <ul className="gallery" style={{ ['--cols' as string]: cols }} role="list">
        {images.map((image, i) => (
          <li key={`${image.src}-${i}`}>
            <button
              ref={(node) => {
                triggers.current[i] = node
              }}
              type="button"
              className="gallery__item"
              onClick={() => open(i)}
              aria-haspopup="dialog"
              aria-label={`${t.openImage}: ${describe(image, i)}`}
            >
              <MediaFrame
                as="span"
                media={image}
                locale={locale}
                ratio="4/3"
                sizes={cols === 1 ? '(min-width: 1040px) 960px, 92vw' : `(min-width: 900px) ${Math.round(1000 / cols)}px, 92vw`}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={t.imageViewer}
        aria-describedby={current ? 'lightbox-caption' : undefined}
        onClose={onClose}
        onClick={(e) => {
          if (e.target === e.currentTarget) dialogRef.current?.close()
        }}
        onTouchStart={(e) => (touchX.current = e.touches[0]?.clientX ?? null)}
        onTouchEnd={(e) => {
          const start = touchX.current
          const end = e.changedTouches[0]?.clientX
          touchX.current = null
          if (start === null || end === undefined || Math.abs(end - start) < 40) return
          const rtl = document.documentElement.dir === 'rtl'
          go(end < start !== rtl ? 1 : -1)
        }}
      >
        {current ? (
          <div className="lightbox__inner">
            <div className="lightbox__bar">
              <p className="lightbox__count" aria-live="polite" aria-atomic="true">
                {counter(index!)}
              </p>
              <button type="button" className="lightbox__close" onClick={() => dialogRef.current?.close()} autoFocus>
                <span className="lightbox__close-icon" aria-hidden="true" />
                <span>{t.closeImage}</span>
              </button>
            </div>
            <figure className="lightbox__figure">
              <Picture key={current.src} media={current} sizes="100vw" priority className="lightbox__image" />
              <figcaption id="lightbox-caption" className="lightbox__caption">
                {current.caption || current.alt || counter(index!)}
              </figcaption>
            </figure>
            {count > 1 ? (
              <div className="lightbox__nav">
                <button type="button" className="lightbox__step" onClick={() => go(-1)} aria-label={`${t.previous}: ${describe(previous, (index! - 1 + count) % count)}`}>
                  <span className="lightbox__step-label">
                    <span aria-hidden="true" className="arrow arrow--back" /> {t.previous}
                  </span>
                  <Picture media={previous!} sizes="96px" alt="" cover className="lightbox__preview" />
                </button>
                <button type="button" className="lightbox__step" onClick={() => go(1)} aria-label={`${t.next}: ${describe(next, (index! + 1) % count)}`}>
                  <span className="lightbox__step-label">
                    {t.next} <span aria-hidden="true" className="arrow" />
                  </span>
                  <Picture media={next!} sizes="96px" alt="" cover className="lightbox__preview" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  )
}

'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { copy, interpolate } from '@/lib/i18n'
import type { ResolvedMedia } from '@/lib/media'
import { toLocaleDigits } from '@/lib/runtime'
import type { Locale } from '@/lib/types'

import { MediaFrame, type FrameRatio } from './MediaFrame'
import { Picture } from './Picture'

/** Natural proportions when every image shares one, otherwise a calm 4:3 crop on the focal point. */
export function galleryRatio(images: ResolvedMedia[]): FrameRatio {
  if (images.length < 2) return 'natural'
  const ratios = images.map((m) => m.width / m.height)
  const first = ratios[0]!
  return ratios.every((r) => Math.abs(r - first) / first < 0.04) ? 'natural' : '4/3'
}

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
  const [index, setIndex] = useState<number | null>(null)
  const ratio = galleryRatio(images)
  const count = images.length
  const cols = Math.min(Math.max(columns, 1), 4)

  const go = useCallback(
    (step: number) => setIndex((i) => (i === null ? i : (i + step + count) % count)),
    [count],
  )

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (index !== null && !dialog.open) dialog.showModal()
    if (index === null && dialog.open) dialog.close()
  }, [index])

  useEffect(() => {
    if (index === null) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return
      e.preventDefault()
      const rtl = document.documentElement.dir === 'rtl'
      go((e.key === 'ArrowRight') !== rtl ? 1 : -1)
    }
    addEventListener('keydown', onKey)
    return () => removeEventListener('keydown', onKey)
  }, [index, go])

  const touchX = useRef<number | null>(null)
  const current = index === null ? null : images[index]
  const counter = (n: number) =>
    interpolate(t.imageOf, { n: toLocaleDigits(String(n + 1), locale), total: toLocaleDigits(String(count), locale) })

  if (!count) return null

  return (
    <>
      <ul className="gallery" style={{ ['--cols' as string]: cols }} role="list">
        {images.map((image, i) => (
          <li key={`${image.src}-${i}`}>
            <button
              type="button"
              className="gallery__item"
              onClick={() => setIndex(i)}
              aria-label={`${t.openImage} — ${image.alt || counter(i)}`}
            >
              <MediaFrame
                as="span"
                media={image}
                locale={locale}
                ratio={ratio}
                sizes={`(min-width: 900px) ${Math.round(100 / cols)}vw, 100vw`}
              />
            </button>
          </li>
        ))}
      </ul>

      <dialog
        ref={dialogRef}
        className="lightbox"
        aria-label={current ? current.alt || counter(index!) : t.openImage}
        onClose={() => setIndex(null)}
        onClick={(e) => {
          if (e.target === e.currentTarget) setIndex(null)
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
              <span className="lightbox__count" aria-live="polite">
                {counter(index!)}
              </span>
              <button type="button" className="text-link" onClick={() => setIndex(null)} autoFocus>
                {t.close}
              </button>
            </div>
            <figure className="lightbox__figure">
              <Picture key={current.src} media={current} sizes="100vw" priority className="lightbox__image" />
              {current.alt ? <figcaption className="lightbox__caption">{current.alt}</figcaption> : null}
            </figure>
            {count > 1 ? (
              <div className="lightbox__nav">
                <button type="button" className="text-link" onClick={() => go(-1)}>
                  <span aria-hidden="true" className="arrow arrow--back" /> {t.previous}
                </button>
                <button type="button" className="text-link" onClick={() => go(1)}>
                  {t.next} <span aria-hidden="true" className="arrow" />
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </dialog>
    </>
  )
}

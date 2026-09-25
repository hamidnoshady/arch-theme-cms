'use client'

import { useEffect, useRef, useState } from 'react'

import { copy } from '@/lib/i18n'
import type { ResolvedMedia } from '@/lib/media'
import type { Locale } from '@/lib/types'

/**
 * Nothing downloads until the frame nears the viewport (a metadata-only first
 * frame when there is no poster) and the file itself only loads on play. Playback
 * uses the browser's native, keyboard-accessible controls; audio never autoplays.
 */
export function VideoPlayer({ media, locale }: { media: ResolvedMedia; locale: Locale }) {
  const t = copy[locale]
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [near, setNear] = useState(false)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el || near) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    if (!active) return
    const video = videoRef.current
    video?.focus()
    video?.play().catch(() => undefined)
  }, [active])

  const label = media.alt ? `${t.play}: ${media.alt}` : t.play

  return (
    <div ref={wrapRef} className="video" style={{ aspectRatio: `${media.width} / ${media.height}` }}>
      {active ? (
        <video
          ref={videoRef}
          className="video__element"
          controls
          playsInline
          preload="auto"
          poster={media.poster}
          width={media.width}
          height={media.height}
          aria-label={media.alt || t.video}
        >
          <source src={media.src} type={media.mimeType} />
          <p>
            {t.videoUnsupported}{' '}
            <a className="text-link" href={media.src}>
              {t.downloadVideo}
            </a>
          </p>
        </video>
      ) : (
        <button type="button" className="video__poster" onClick={() => setActive(true)} aria-label={label}>
          {media.poster ? (
            // eslint-disable-next-line @next/next/no-img-element -- poster comes from CMS media sizes.
            <img className="video__still" src={media.poster} alt="" loading="lazy" decoding="async" />
          ) : near ? (
            <video
              className="video__still"
              src={`${media.src}#t=0.1`}
              preload="metadata"
              muted
              playsInline
              tabIndex={-1}
              aria-hidden="true"
            />
          ) : null}
          <span className="video__play" aria-hidden="true">
            <svg viewBox="0 0 24 24">
              <path d="M9 7.5v9l7.5-4.5z" fill="currentColor" />
            </svg>
          </span>
          <span className="video__tag" aria-hidden="true">
            {t.video}
          </span>
        </button>
      )}
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'

import type { ResolvedMedia } from '@/lib/media'

/**
 * One CMS image. A file that fails to load marks its frame `data-media="failed"`, which
 * removes the frame from the layout (media.css): an optional picture that cannot be shown
 * is hidden, never left as a placeholder that pulses as if it were still on its way.
 */
export function Picture({
  media,
  sizes = '(min-width: 1500px) 1400px, 100vw',
  priority = false,
  cover = false,
  className = '',
  alt,
}: {
  media: ResolvedMedia
  sizes?: string
  priority?: boolean
  /** Fill the frame (object-fit: cover) around the CMS focal point. */
  cover?: boolean
  className?: string
  alt?: string
}) {
  const ref = useRef<HTMLImageElement>(null)
  const [failed, setFailed] = useState(false)

  // An error that fired before hydration left no listener behind; the element remembers it.
  useEffect(() => {
    const img = ref.current
    if (img?.complete && img.naturalWidth === 0 && img.currentSrc) setFailed(true)
  }, [])

  useEffect(() => {
    const frame = ref.current?.closest('.frame')
    if (!frame) return
    if (failed) frame.setAttribute('data-media', 'failed')
    else frame.removeAttribute('data-media')
  }, [failed])

  return (
    // eslint-disable-next-line @next/next/no-img-element -- CMS sizes provide the srcset; no image optimiser in front of the CMS proxy.
    <img
      ref={ref}
      className={`picture ${cover ? 'picture--cover' : ''} ${className}`}
      src={media.src}
      srcSet={media.srcSet}
      sizes={media.srcSet ? sizes : undefined}
      width={media.width}
      height={media.height}
      alt={alt ?? media.alt}
      loading={priority ? 'eager' : 'lazy'}
      fetchPriority={priority ? 'high' : undefined}
      decoding="async"
      onError={() => setFailed(true)}
      data-failed={failed || undefined}
      style={cover && media.position ? { objectPosition: media.position } : undefined}
    />
  )
}

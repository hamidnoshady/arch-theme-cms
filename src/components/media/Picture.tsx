import type { ResolvedMedia } from '@/lib/media'

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
  return (
    // eslint-disable-next-line @next/next/no-img-element -- CMS sizes provide the srcset; no image optimiser in front of the CMS proxy.
    <img
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
      style={cover && media.position ? { objectPosition: media.position } : undefined}
    />
  )
}

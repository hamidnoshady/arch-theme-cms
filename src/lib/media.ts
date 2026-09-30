import { richTextToPlain } from './richtext'
import type { Media, MediaSize, Ref, SiteDescriptor } from './types'

export type ResolvedMedia = {
  kind: 'image' | 'video'
  src: string
  srcSet?: string
  width: number
  height: number
  alt: string
  mimeType?: string
  /** CSS object-position from Payload's focal point, so crops keep the subject. */
  position?: string
  poster?: string
  caption?: string
}

const IMAGE_SIZES = ['small', 'medium', 'large', 'xlarge'] as const
const VIDEO_EXT = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i

/**
 * Origin media URLs are resolved against. `media.url` is always relative
 * (`/api/media/file/…`). Order: explicit override → the site's media origin once
 * its domain is verified → this deployment's own `/api` proxy (preview hosts).
 *
 * An origin on the site's own domain is dropped: this deployment *is* that domain and
 * proxies `/api/media/file/*`, so a relative URL is equivalent — and immune to the CMS
 * reporting the wrong protocol or port (it once sent `https://acme.com:3000`, which broke
 * every image and logo on the site).
 */
export function mediaOrigin(site: SiteDescriptor | null): string {
  const override = process.env.NEXT_PUBLIC_MEDIA_ORIGIN?.trim()
  if (override) return override.replace(/\/$/, '')
  const origin = site?.media?.origin
  if (!origin || site.domainVerified === false) return ''
  try {
    if (new URL(origin).hostname === site.domain) return ''
  } catch {
    return ''
  }
  return origin.replace(/\/$/, '')
}

export function absoluteMediaUrl(url: string | null | undefined, origin: string): string {
  if (!url) return ''
  if (/^(https?:)?\/\//i.test(url) || url.startsWith('data:')) return url
  const path = url.startsWith('/') ? url : `/${url}`
  return origin ? new URL(path, `${origin}/`).toString() : path
}

export function asMedia(value: Ref<Media>): Media | null {
  return value && typeof value === 'object' && (value.url || value.filename) ? value : null
}

export function isVideoMime(mime?: string | null, url?: string | null): boolean {
  return Boolean(mime?.startsWith('video/') || (url && VIDEO_EXT.test(url)))
}

export function resolveMedia(value: Ref<Media>, origin: string, fallbackAlt = ''): ResolvedMedia | null {
  const media = asMedia(value)
  if (!media?.url) return null
  const video = isVideoMime(media.mimeType, media.url)
  const width = media.width || 1600
  const height = media.height || (video ? 900 : 1067)
  const sizes = media.sizes ?? {}

  const candidates = IMAGE_SIZES.map((key) => sizes[key])
    .filter((s): s is MediaSize & { url: string; width: number } => Boolean(s?.url && s.width))
    .filter((s) => s.width < width)
  const srcSet = video
    ? undefined
    : [...candidates.map((s) => `${absoluteMediaUrl(s.url, origin)} ${s.width}w`), `${absoluteMediaUrl(media.url, origin)} ${width}w`].join(', ')

  const hasFocal = typeof media.focalX === 'number' && typeof media.focalY === 'number'
  return {
    kind: video ? 'video' : 'image',
    src: absoluteMediaUrl(media.url, origin),
    srcSet: srcSet || undefined,
    width,
    height,
    alt: media.alt?.trim() || fallbackAlt,
    mimeType: media.mimeType ?? undefined,
    position: hasFocal ? `${media.focalX}% ${media.focalY}%` : undefined,
    poster: video && media.thumbnailURL ? absoluteMediaUrl(media.thumbnailURL, origin) : undefined,
    caption: richTextToPlain(media.caption) || undefined,
  }
}

/** A video referenced by URL (e.g. a rich-text link), rendered with the same player. */
export function resolveVideoUrl(url: string, label = ''): ResolvedMedia {
  return { kind: 'video', src: url, width: 1600, height: 900, alt: label }
}

export function ogImageUrl(value: Ref<Media>, origin: string): string | undefined {
  const media = asMedia(value)
  if (!media) return undefined
  return absoluteMediaUrl(media.sizes?.og?.url || media.sizes?.large?.url || media.url, origin) || undefined
}

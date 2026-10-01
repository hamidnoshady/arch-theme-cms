import type { ResolvedMedia } from '@/lib/media'
import type { Locale } from '@/lib/types'

import { Picture } from './Picture'
import { VideoPlayer } from './VideoPlayer'

export type FrameRatio = 'natural' | '4/3' | '3/2' | '16/9' | '4/5' | '1/1'

/**
 * The one media container: a hairline outer frame with inset padding, so a
 * photograph never touches the border. Used by cards, heroes, blocks and galleries.
 * `as="span"` lets it sit inside interactive phrasing content (gallery buttons).
 */
export function MediaFrame({
  media,
  locale,
  ratio = 'natural',
  sizes,
  priority,
  caption,
  variant = 'inset',
  as = 'figure',
  className = '',
}: {
  media: ResolvedMedia
  locale: Locale
  ratio?: FrameRatio
  sizes?: string
  priority?: boolean
  caption?: React.ReactNode
  variant?: 'inset' | 'bare'
  as?: 'figure' | 'span'
  className?: string
}) {
  const fixed = ratio !== 'natural'
  /*
   * A fixed frame is told the ratio to crop to; a natural one is told the ratio the
   * picture already has, so the frame can be as wide as the image rather than as wide
   * as the column. Both are unitless CSS numbers consumed in media.css.
   */
  const style = (
    fixed
      ? { ['--ratio' as string]: ratio }
      : { ['--media-ar' as string]: String(media.width / media.height || 1.5) }
  ) as React.CSSProperties
  const classes = `frame frame--${variant} ${fixed ? 'frame--fixed' : 'frame--natural'} ${className}`.trim()
  const body =
    media.kind === 'video' && as === 'figure' ? (
      <VideoPlayer media={media} locale={locale} />
    ) : (
      <Picture media={media} sizes={sizes} priority={priority} cover={fixed} />
    )

  if (as === 'span') {
    return (
      <span className={classes} style={style} data-reveal="">
        <span className="frame__media">{body}</span>
      </span>
    )
  }
  return (
    <figure className={classes} style={style} data-reveal="">
      <div className="frame__media">{body}</div>
      {caption ? <figcaption className="frame__caption">{caption}</figcaption> : null}
    </figure>
  )
}

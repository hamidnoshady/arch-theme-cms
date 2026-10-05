import { Fragment } from 'react'

import { Gallery } from '@/components/media/Gallery'
import { MediaFrame } from '@/components/media/MediaFrame'
import { referenceHref, safeHref } from '@/lib/links'
import { isVideoMime, resolveMedia, resolveVideoUrl, type ResolvedMedia } from '@/lib/media'
import { isAnchorHeading, mediaOfNode, nodeText } from '@/lib/richtext'
import type { LexicalNode, Locale, RichTextData } from '@/lib/types'

/** `ids` carries the section-anchor id of each root-level h2 (see `headingAnchors`). */
type Ctx = { locale: Locale; origin: string; ids?: Map<LexicalNode, string> }

const FORMAT = { bold: 1, italic: 2, strike: 4, underline: 8, code: 16, sub: 32, sup: 64, highlight: 128 }

const mediaOf = mediaOfNode

function videoLinkOf(node: LexicalNode): { url: string; label: string } | null {
  if (node.type !== 'paragraph') return null
  const kids = (node.children ?? []).filter((c) => !(c.type === 'text' && !c.text?.trim()))
  if (kids.length !== 1) return null
  const link = kids[0]!
  if (link.type !== 'link' && link.type !== 'autolink') return null
  const url = String(link.fields?.url ?? '')
  return url && isVideoMime(null, url) && safeHref(url) ? { url, label: nodeText(link).trim() } : null
}

export function isEmptyRichText(data: RichTextData | null | undefined): boolean {
  const children = data?.root?.children ?? []
  return !children.some((n) => nodeText(n).trim() || mediaOf(n) || n.type === 'horizontalrule')
}

type Grouped = LexicalNode | { type: '__gallery'; items: ResolvedMedia[]; key: string }

function group(nodes: LexicalNode[], ctx: Ctx): Grouped[] {
  const out: Grouped[] = []
  let run: ResolvedMedia[] = []
  const flush = () => {
    if (run.length > 1) out.push({ type: '__gallery', items: run, key: run[0]!.src })
    else if (run.length === 1) out.push({ type: '__media', value: run[0] } as LexicalNode)
    run = []
  }
  for (const node of nodes) {
    const media = mediaOf(node)
    const resolved = media ? resolveMedia(media, ctx.origin) : null
    if (resolved?.kind === 'image') {
      run.push(resolved)
      continue
    }
    flush()
    if (resolved) out.push({ type: '__media', value: resolved } as LexicalNode)
    else if (!media) out.push(node)
  }
  flush()
  return out
}

function renderText(node: LexicalNode, key: string) {
  const format = typeof node.format === 'number' ? node.format : 0
  let el: React.ReactNode = node.text ?? ''
  if (format & FORMAT.code) el = <code>{el}</code>
  if (format & FORMAT.highlight) el = <mark>{el}</mark>
  if (format & FORMAT.sub) el = <sub>{el}</sub>
  if (format & FORMAT.sup) el = <sup>{el}</sup>
  if (format & FORMAT.strike) el = <s>{el}</s>
  if (format & FORMAT.underline) el = <u>{el}</u>
  if (format & FORMAT.italic) el = <em>{el}</em>
  if (format & FORMAT.bold) el = <strong>{el}</strong>
  return <Fragment key={key}>{el}</Fragment>
}

const alignStyle = (node: LexicalNode): React.CSSProperties | undefined => {
  const f = node.format
  if (f === 'center' || f === 'justify') return { textAlign: f }
  if (f === 'right' || f === 'end') return { textAlign: 'end' }
  return undefined
}

function renderLink(node: LexicalNode, ctx: Ctx, key: string) {
  const fields = node.fields ?? {}
  const internal = fields.linkType === 'internal'
  const target = internal
    ? referenceHref(fields.doc as { relationTo?: string; value?: unknown }, ctx.locale)
    : safeHref(String(fields.url ?? node.url ?? ''))
  const children = renderNodes(node.children ?? [], ctx, key)
  if (!target) return <Fragment key={key}>{children}</Fragment>
  const external = /^(https?:)?\/\//i.test(target)
  return (
    <a
      key={key}
      className="text-link text-link--inline"
      href={target}
      {...(fields.newTab || external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {children}
    </a>
  )
}

function renderNode(node: Grouped, ctx: Ctx, key: string): React.ReactNode {
  if (node.type === '__gallery') {
    return (
      <div key={key} className="rt-media rt-media--gallery">
        <Gallery images={(node as { items: ResolvedMedia[] }).items} locale={ctx.locale} columns={2} />
      </div>
    )
  }
  const n = node as LexicalNode
  const kids = () => renderNodes(n.children ?? [], ctx, key)

  switch (n.type) {
    case '__media': {
      const media = n.value as ResolvedMedia
      return (
        <div key={key} className="rt-media">
          <MediaFrame media={media} locale={ctx.locale} sizes="(min-width: 820px) 760px, 92vw" caption={media.caption} />
        </div>
      )
    }
    case 'text':
      return renderText(n, key)
    case 'linebreak':
      return <br key={key} />
    case 'tab':
      return <Fragment key={key}>{'\t'}</Fragment>
    case 'paragraph': {
      const video = videoLinkOf(n)
      if (video) {
        return (
          <div key={key} className="rt-media">
            <MediaFrame media={resolveVideoUrl(video.url, video.label)} locale={ctx.locale} />
          </div>
        )
      }
      if (!nodeText(n).trim()) return null
      return (
        <p key={key} style={alignStyle(n)}>
          {kids()}
        </p>
      )
    }
    case 'heading': {
      const raw = Number(String(n.tag ?? 'h2').replace('h', '')) || 2
      // Page templates own h1; rich text starts at h2 for valid outline.
      const level = Math.min(Math.max(raw === 1 ? 2 : raw, 2), 4)
      const Tag = `h${level}` as 'h2' | 'h3' | 'h4'
      if (!nodeText(n).trim()) return null
      return (
        <Tag key={key} id={ctx.ids?.get(n)} className={`rt-h${level}`} style={alignStyle(n)}>
          {kids()}
        </Tag>
      )
    }
    case 'link':
    case 'autolink':
      return renderLink(n, ctx, key)
    case 'list': {
      if (!nodeText(n).trim()) return null
      const Tag = n.listType === 'number' ? 'ol' : 'ul'
      return (
        <Tag key={key} className={`rt-list rt-list--${n.listType ?? 'bullet'}`} start={n.listType === 'number' ? n.start : undefined}>
          {kids()}
        </Tag>
      )
    }
    case 'listitem': {
      if (!nodeText(n).trim()) return null
      const nested = (n.children ?? []).every((c) => c.type === 'list')
      return (
        <li
          key={key}
          className={nested ? 'rt-list__nested' : undefined}
          aria-checked={n.checked === undefined ? undefined : n.checked}
          role={n.checked === undefined ? undefined : 'checkbox'}
        >
          {kids()}
        </li>
      )
    }
    case 'quote':
      return nodeText(n).trim() ? <blockquote key={key}>{kids()}</blockquote> : null
    case 'horizontalrule':
      return <hr key={key} className="rule rt-rule" />
    case 'block': {
      const fields = n.fields ?? {}
      if (fields.blockType === 'banner') {
        const content = fields.content as RichTextData | undefined
        return (
          <aside key={key} className="rt-banner">
            {content ? renderNodes(content.root?.children ?? [], ctx, key) : null}
          </aside>
        )
      }
      if (fields.blockType === 'code') {
        return (
          <pre key={key} className="rt-code" dir="ltr">
            <code>{String(fields.code ?? '')}</code>
          </pre>
        )
      }
      return null
    }
    default:
      return n.children?.length ? <Fragment key={key}>{kids()}</Fragment> : null
  }
}

function renderNodes(nodes: LexicalNode[], ctx: Ctx, prefix: string): React.ReactNode[] {
  return nodes.map((node, i) => renderNode(node, ctx, `${prefix}.${i}`))
}

export function RichText({
  data,
  locale,
  origin,
  variant = 'prose',
  className = '',
  anchors = false,
}: {
  data: RichTextData | null | undefined
  locale: Locale
  origin: string
  variant?: 'prose' | 'lead' | 'compact'
  className?: string
  /** Give root-level h2s the positional ids `headingAnchors` links to. */
  anchors?: boolean
}) {
  if (!data?.root || isEmptyRichText(data)) return null
  const ids = new Map<LexicalNode, string>()
  if (anchors) (data.root.children ?? []).filter(isAnchorHeading).forEach((node, i) => ids.set(node, `section-${i + 1}`))
  const ctx: Ctx = { locale, origin, ids }
  return (
    <div className={`rich-text rich-text--${variant} ${className}`} dir={data.root.direction ?? undefined}>
      {group(data.root.children ?? [], ctx).map((node, i) => renderNode(node, ctx, `n${i}`))}
    </div>
  )
}

import type { LexicalNode, Media, RichTextData } from './types'

export function nodeText(node: LexicalNode | null | undefined): string {
  if (!node) return ''
  if (node.type === 'text') return node.text ?? ''
  if (node.type === 'linebreak') return '\n'
  return (node.children ?? []).map(nodeText).join('')
}

export function richTextToPlain(data: RichTextData | null | undefined): string {
  return (data?.root?.children ?? []).map(nodeText).join('\n').trim()
}

/** The media document a rich-text node embeds (an upload node or an inline media block). */
export function mediaOfNode(node: LexicalNode): Media | null {
  const value =
    node.type === 'upload' && node.relationTo === 'media'
      ? node.value
      : node.type === 'block' && node.fields?.blockType === 'mediaBlock'
        ? node.fields.media
        : null
  return value && typeof value === 'object' && ((value as Media).url || (value as Media).filename) ? (value as Media) : null
}

/** Identity of a media document across surfaces: its id, else its URL without query. */
export function mediaKey(media: Pick<Media, 'id' | 'url'> | null | undefined): string {
  return media?.id || media?.url?.split('?')[0] || ''
}

const VIDEO = /\.(mp4|webm|mov|m4v|ogv)(\?|#|$)/i
const isImage = (media: Media) => !(media.mimeType?.startsWith('video/') || (media.url && VIDEO.test(media.url)))

const normalise = (value: string) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase()

/**
 * Drops the first meaningful node when it is a heading that repeats `title`. Page heroes
 * conventionally open with the page title as an h1; the page template already sets that
 * title as the page's one h1, so rendering it again reads as a stutter.
 */
export function withoutLeadingTitle(data: RichTextData | null | undefined, title: string | null | undefined): RichTextData | null {
  const children = data?.root?.children ?? []
  if (!data || !title) return data ?? null
  const index = children.findIndex((n) => nodeText(n).trim() || mediaOfNode(n))
  const first = children[index]
  if (!first || first.type !== 'heading' || normalise(nodeText(first)) !== normalise(title)) return data
  return { root: { ...data.root, children: children.filter((_, i) => i !== index) } }
}

/** A root-level heading that renders as an h2 with text: the unit a section anchor marks. */
export function isAnchorHeading(node: LexicalNode): boolean {
  if (node.type !== 'heading' || !nodeText(node).trim()) return false
  const level = Number(String(node.tag ?? 'h2').replace('h', '')) || 2
  return level <= 2
}

export type Anchor = { id: string; text: string }

/**
 * Section anchors for a long body, in reading order. Ids are positional (`section-1`, …),
 * so they are stable across locales and never depend on how a Persian heading slugifies;
 * `RichText` assigns the same ids with the same rule.
 */
export function headingAnchors(data: RichTextData | null | undefined): Anchor[] {
  return (data?.root?.children ?? [])
    .filter(isAnchorHeading)
    .map((node, i) => ({ id: `section-${i + 1}`, text: nodeText(node).trim() }))
}

/**
 * Lifts every root-level image out of a body so a project can show its imagery once, as
 * one gallery. Images already shown elsewhere (the hero) and repeats inside the body are
 * dropped; videos stay in the body, where the editor placed them.
 */
export function splitBodyImages(
  data: RichTextData | null | undefined,
  shown: Iterable<string> = [],
): { body: RichTextData | null; images: Media[] } {
  if (!data?.root) return { body: data ?? null, images: [] }
  const seen = new Set([...shown].filter(Boolean))
  const images: Media[] = []
  const children = (data.root.children ?? []).filter((node) => {
    const media = mediaOfNode(node)
    if (!media || !isImage(media)) return true
    const key = mediaKey(media)
    if (key && !seen.has(key)) {
      seen.add(key)
      images.push(media)
    }
    return false
  })
  return { body: { root: { ...data.root, children } }, images }
}

/** Removes root-level embeds of media already shown elsewhere on the page (an article's hero). */
export function withoutMedia(data: RichTextData | null | undefined, keys: Iterable<string>): RichTextData | null {
  const drop = new Set([...keys].filter(Boolean))
  if (!data?.root || !drop.size) return data ?? null
  const children = (data.root.children ?? []).filter((node) => !drop.has(mediaKey(mediaOfNode(node))))
  return { root: { ...data.root, children } }
}

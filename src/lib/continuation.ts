import type { Post } from './types'

/** The editor's related posts that exist in this section and locale, else the next few. */
export function moreEntries(post: Post, siblings: Post[], limit = 3) {
  const inSection = new Map(siblings.map((s) => [s.id, s]))
  const related = (post.relatedPosts ?? [])
    .map((p) => (typeof p === 'string' ? p : p?.id))
    .map((id) => (id ? inSection.get(id) : undefined))
    .filter((p): p is Post => Boolean(p) && p!.id !== post.id)
  const index = siblings.findIndex((s) => s.id === post.id)
  const adjacent = Array.from({ length: limit }, (_, i) => siblings[(index + i + 1 + siblings.length) % siblings.length])
    .filter((p, i, all): p is Post => Boolean(p) && p!.id !== post.id && all.findIndex((o) => o?.id === p!.id) === i)
  return { items: (related.length ? related : adjacent).slice(0, limit), related: related.length > 0 }
}

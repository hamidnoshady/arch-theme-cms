import { extractFacts, type Fact } from '@/components/content/RichText'
import type { Post, RichTextData } from '@/lib/types'

/** Optional structured portfolio fields when the CMS adds them to posts. */
export type StructuredProjectMeta = {
  location?: string | null
  year?: string | null
  area?: string | null
  collaborators?: string | null
  client?: string | null
  status?: string | null
  facts?: { label?: string | null; value?: string | null }[] | null
}

const LABELS: Record<string, { fa: string; en: string }> = {
  location: { fa: 'مکان', en: 'Location' },
  year: { fa: 'سال', en: 'Year' },
  area: { fa: 'مساحت', en: 'Area' },
  collaborators: { fa: 'همکاران', en: 'Collaborators' },
  client: { fa: 'کارفرما', en: 'Client' },
  status: { fa: 'وضعیت', en: 'Status' },
}

function structuredFromPost(post: Post, locale: 'fa' | 'en'): Fact[] {
  const raw = (post as Post & { portfolio?: StructuredProjectMeta; projectMeta?: StructuredProjectMeta }).portfolio ??
    (post as Post & { projectMeta?: StructuredProjectMeta }).projectMeta
  if (!raw) return []

  const facts: Fact[] = []
  for (const key of Object.keys(LABELS) as (keyof typeof LABELS)[]) {
    const value = raw[key as keyof StructuredProjectMeta]
    if (typeof value === 'string' && value.trim()) {
      facts.push({ label: LABELS[key][locale], value: value.trim() })
    }
  }
  for (const row of raw.facts ?? []) {
    if (row?.label?.trim() && row?.value?.trim()) facts.push({ label: row.label.trim(), value: row.value.trim() })
  }
  return facts
}

/** Structured CMS project metadata first, then legacy bullet-list compatibility. */
export function projectFactsAndBody(
  post: Post,
  locale: 'fa' | 'en',
): { facts: Fact[]; body: RichTextData | null } {
  const structured = structuredFromPost(post, locale)
  if (structured.length) return { facts: structured, body: post.content ?? null }
  const legacy = extractFacts(post.content)
  return { facts: legacy.facts, body: legacy.body }
}

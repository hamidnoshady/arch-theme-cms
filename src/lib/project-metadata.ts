import { formatDate } from '@eshobe/site-runtime'

import { nodeText } from './richtext'
import type { LexicalNode, Locale, Post, RichTextData } from './types'

/**
 * Project facts — the one source of truth for what a project page, a project card and
 * any future surface say about location, year, area and the rest.
 *
 * The CMS's contract is the structured `projectMetadata` group on posts
 * (`src/collections/Posts/index.ts` in eshobe-cms). Older content carries the same facts
 * as the first bullet list of the body, one `Label: Value` per item. That legacy form is
 * still read — the CMS has no migration that moves it yet — but only when the structured
 * group is empty, and a legacy list is never rendered a second time inside the body.
 */

export type Fact = { label: string; value: string }

export type ProjectMetadata = {
  location?: string | null
  /** ISO date; only the year is shown. */
  date?: string | null
  area?: string | null
  status?: string | null
  client?: string | null
  additionalFacts?: { id?: string | null; label?: string | null; value?: string | null }[] | null
}

const LABELS = {
  location: { fa: 'مکان', en: 'Location' },
  date: { fa: 'سال', en: 'Year' },
  area: { fa: 'مساحت', en: 'Area' },
  status: { fa: 'وضعیت', en: 'Status' },
  client: { fa: 'کارفرما', en: 'Client' },
} as const

const text = (value: unknown): string => (typeof value === 'string' ? value.trim() : '')

/** The year of a CMS date, in the locale's calendar (Jalali on `fa`), or '' when invalid. */
export function factYear(value: string | null | undefined, locale: Locale): string {
  if (!value || Number.isNaN(Date.parse(value))) return ''
  return formatDate(value, locale, { year: 'numeric' })
}

/** Structured facts in display order; empty values are skipped, nothing is invented. */
export function structuredFacts(meta: ProjectMetadata | null | undefined, locale: Locale): Fact[] {
  if (!meta || typeof meta !== 'object') return []
  const facts: Fact[] = []
  const location = text(meta.location)
  if (location) facts.push({ label: LABELS.location[locale], value: location })
  const year = factYear(meta.date, locale)
  if (year) facts.push({ label: LABELS.date[locale], value: year })
  for (const key of ['area', 'status', 'client'] as const) {
    const value = text(meta[key])
    if (value) facts.push({ label: LABELS[key][locale], value })
  }
  for (const row of meta.additionalFacts ?? []) {
    const label = text(row?.label)
    const value = text(row?.value)
    if (label && value) facts.push({ label, value })
  }
  return facts
}

const hasMedia = (node: LexicalNode) =>
  node.type === 'upload' || (node.type === 'block' && node.fields?.blockType === 'mediaBlock')

/**
 * Legacy facts: the first meaningful node of the body is a bullet list whose every item
 * reads `Label: Value`. Anything else — a numbered list, prose, a list with one ordinary
 * item — is body content and stays where the editor put it.
 */
export function extractLegacyFacts(data: RichTextData | null | undefined): { facts: Fact[]; body: RichTextData | null } {
  const children = data?.root?.children ?? []
  const firstIndex = children.findIndex((n) => nodeText(n).trim() || hasMedia(n))
  const first = children[firstIndex]
  if (!data || !first || first.type !== 'list' || first.listType === 'number') return { facts: [], body: data ?? null }
  const facts: Fact[] = []
  for (const item of first.children ?? []) {
    const m = nodeText(item).trim().match(/^([^:：]{1,40})[:：]\s*(.{1,160})$/s)
    if (!m) return { facts: [], body: data }
    facts.push({ label: m[1]!.trim(), value: m[2]!.trim() })
  }
  if (!facts.length) return { facts: [], body: data }
  const rest = children.filter((_, i) => i !== firstIndex)
  return { facts, body: { root: { ...data.root, children: rest } } }
}

export type ProjectFacts = { facts: Fact[]; body: RichTextData | null; source: 'structured' | 'legacy' | 'none' }

/** Structured CMS metadata first, then the legacy list — and the legacy list never twice. */
export function projectFactsAndBody(
  post: Pick<Post, 'content' | 'projectMetadata'>,
  locale: Locale,
): ProjectFacts {
  const legacy = extractLegacyFacts(post.content)
  const structured = structuredFacts(post.projectMetadata, locale)
  if (structured.length) return { facts: structured, body: legacy.body, source: 'structured' }
  if (legacy.facts.length) return { facts: legacy.facts, body: legacy.body, source: 'legacy' }
  return { facts: [], body: post.content ?? null, source: 'none' }
}

/** One short line for a card: location and year, when the CMS has them. */
export function projectCardLine(post: Pick<Post, 'projectMetadata'>, locale: Locale): string {
  const meta = post.projectMetadata
  const parts = [text(meta?.location), factYear(meta?.date, locale)].filter(Boolean)
  return parts.join(locale === 'fa' ? '، ' : ' · ')
}

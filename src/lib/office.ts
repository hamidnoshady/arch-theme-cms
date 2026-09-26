import { getSectionPage } from './cms'
import { parseMapUrl, type MapLocation } from './map'
import type { Block, LexicalNode, LinkField, Locale, Page, RichTextData } from './types'

export type ContactBlockData = {
  heading?: string | null
  address?: string | null
  phones?: string[] | null
  email?: string | null
  hours?: string | null
  latitude?: number | null
  longitude?: number | null
  mapUrl?: string | null
}

function linksInRichText(data: RichTextData | null | undefined): string[] {
  const out: string[] = []
  const walk = (n: LexicalNode) => {
    if ((n.type === 'link' || n.type === 'autolink') && n.fields?.url) out.push(String(n.fields.url))
    n.children?.forEach(walk)
  }
  if (data?.root) walk(data.root)
  return out
}

function urlsOfPage(page: Page | null): string[] {
  if (!page) return []
  const urls = linksInRichText(page.hero?.richText)
  for (const l of page.hero?.links ?? []) if (l.link?.url) urls.push(l.link.url)
  for (const block of page.layout ?? []) {
    if (block.blockType !== 'content') continue
    for (const col of (block.columns as { richText?: RichTextData; link?: LinkField }[]) ?? []) {
      if (col.link?.type === 'custom' && col.link.url) urls.push(col.link.url)
      urls.push(...linksInRichText(col.richText))
    }
  }
  return urls
}

export function findLocation(pages: (Page | null)[]): MapLocation | null {
  for (const page of pages) {
    for (const url of urlsOfPage(page)) {
      const loc = parseMapUrl(url)
      if (loc) return loc
    }
  }
  return null
}

export function findContactBlock(pages: (Page | null)[]): ContactBlockData | null {
  for (const page of pages) {
    const block = (page?.layout ?? []).find((b: Block) => b.blockType === 'contact')
    if (block) return block as ContactBlockData
  }
  return null
}

export function locationFromContact(contact: ContactBlockData | null): MapLocation | null {
  if (!contact) return null
  const lat = typeof contact.latitude === 'number' ? contact.latitude : null
  const lng = typeof contact.longitude === 'number' ? contact.longitude : null
  if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    const url = contact.mapUrl?.trim() || `geo:${lat},${lng}`
    return { lat, lng, url, zoom: 16 }
  }
  if (contact.mapUrl) return parseMapUrl(contact.mapUrl)
  return null
}

/** Office location and address, only from published CMS content. */
export async function getOffice(locale: Locale, current?: Page | null) {
  const contact = await getSectionPage('contact', locale)
  const pages = current ? [current, contact] : [contact]
  const contactBlock = findContactBlock([contact, ...(current ? [current] : [])])
  const structured = locationFromContact(contactBlock)
  return { location: structured ?? findLocation(pages), contact: contactBlock }
}

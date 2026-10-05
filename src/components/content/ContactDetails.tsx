import { MetaList, type MetaItem } from '@/components/editorial/Editorial'
import { copy } from '@/lib/i18n'
import { toLocaleDigits } from '@eshobe/site-runtime'
import type { Locale } from '@/lib/types'

export type ContactInfo = {
  address?: string | null
  phones?: string[] | null
  email?: string | null
  hours?: string | null
}

const telHref = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`

/** CMS `contact` block fields as a structured list. Renders nothing it was not given. */
export function ContactDetails({ info, locale }: { info: ContactInfo; locale: Locale }) {
  const t = copy[locale]
  const items: MetaItem[] = []
  if (info.address) items.push({ label: t.address, value: <address className="pre-line">{info.address}</address> })
  const phones = (info.phones ?? []).filter(Boolean)
  if (phones.length) {
    items.push({
      label: t.phone,
      value: (
        <span className="stack">
          {phones.map((p) => (
            <a key={p} className="text-link" href={telHref(p)} dir="ltr">
              {toLocaleDigits(p, locale)}
            </a>
          ))}
        </span>
      ),
    })
  }
  if (info.email) {
    items.push({
      label: t.email,
      value: (
        <a className="text-link" href={`mailto:${info.email}`} dir="ltr">
          {info.email}
        </a>
      ),
    })
  }
  if (info.hours) items.push({ label: t.hours, value: <span className="pre-line">{toLocaleDigits(info.hours, locale)}</span> })
  return <MetaList items={items} className="meta-list--stacked" />
}

/**
 * The contact page's primary actions, straight from the CMS contact block: write an
 * email, call. With neither field present nothing renders — no placeholder address or
 * number ever stands in.
 */
export function ContactActions({ info, locale }: { info: ContactInfo; locale: Locale }) {
  const t = copy[locale]
  const email = info.email?.trim()
  const phone = (info.phones ?? []).map((p) => p?.trim()).find(Boolean)
  if (!email && !phone) return null
  return (
    <ul className="contact-actions" role="list" aria-label={t.contactActions}>
      {email ? (
        <li>
          <a className="button" href={`mailto:${email}`}>
            <span>{t.writeEmail}</span>
            <span className="arrow" aria-hidden="true" />
          </a>
        </li>
      ) : null}
      {phone ? (
        <li>
          <a className="button button--quiet" href={telHref(phone)}>
            <span>{t.call}</span>
            <span dir="ltr" className="contact-actions__number">
              {toLocaleDigits(phone, locale)}
            </span>
          </a>
        </li>
      ) : null}
    </ul>
  )
}

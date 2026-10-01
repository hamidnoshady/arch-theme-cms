import { SectionHeading } from '@/components/editorial/Editorial'
import { EntryGrid, toCardEntry } from '@/components/entries/EntryCard'
import { CmsForm } from '@/components/forms/CmsForm'
import { Gallery } from '@/components/media/Gallery'
import { MediaFrame } from '@/components/media/MediaFrame'
import { getForm, getPostsByIds, getPostsForCategories, sectionOfPost } from '@/lib/cms'
import { copy, indexNumber } from '@/lib/i18n'
import { resolveLink, safeHref } from '@/lib/links'
import { isMapUrl } from '@/lib/map'
import { resolveMedia } from '@/lib/media'
import type { Block, Form, LinkField, Locale, Media, Post, Ref, RichTextData } from '@/lib/types'

import { ContactDetails } from './ContactDetails'
import { RichText } from './RichText'

type Ctx = { locale: Locale; origin: string }

const SPAN: Record<string, number> = { oneThird: 4, half: 6, twoThirds: 8, full: 12 }

function CmsLink({ link, ctx, className = 'text-link' }: { link: LinkField | null | undefined; ctx: Ctx; className?: string }) {
  const resolved = resolveLink(link, ctx.locale)
  if (!resolved || !link?.label || !safeHref(resolved.href)) return null
  return (
    <a
      className={className}
      href={resolved.href}
      {...(resolved.newTab || resolved.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      {link.label} <span className={`arrow ${resolved.external ? 'arrow--external' : ''}`} aria-hidden="true" />
    </a>
  )
}

function ContentBlock({ block, ctx }: { block: Block; ctx: Ctx }) {
  const columns = (block.columns as { id?: string; size?: string; richText?: RichTextData; enableLink?: boolean; link?: LinkField }[]) ?? []
  const visible = columns.filter((c) => c.richText || (c.enableLink && c.link))
  if (!visible.length) return null
  return (
    <div className="block-content">
      {visible.map((col, i) => (
        <div key={col.id ?? i} className="block-content__col" style={{ ['--span' as string]: SPAN[col.size ?? 'oneThird'] ?? 4 }}>
          <RichText data={col.richText} locale={ctx.locale} origin={ctx.origin} />
          {col.enableLink && !isMapUrl(col.link?.url) ? <CmsLink link={col.link} ctx={ctx} /> : null}
        </div>
      ))}
    </div>
  )
}

function MediaBlock({ block, ctx }: { block: Block; ctx: Ctx }) {
  const media = resolveMedia(block.media as Ref<Media>, ctx.origin)
  if (!media) return null
  return <MediaFrame media={media} locale={ctx.locale} sizes="(min-width: 820px) 760px, 92vw" caption={media.caption} />
}

function GalleryBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  const images = ((block.images as Ref<Media>[]) ?? [])
    .map((m) => resolveMedia(m, ctx.origin))
    .filter((m): m is NonNullable<typeof m> => m?.kind === 'image')
  if (!images.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <Gallery images={images} locale={ctx.locale} columns={Number(block.columns) || 3} />
    </>
  )
}

function TeamBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  const members = (block.members as { id?: string; name?: string; role?: string; bio?: string; photo?: Ref<Media> }[]) ?? []
  const people = members.filter((m) => m.name)
  if (!people.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ul className="team" role="list" style={{ ['--cols' as string]: Number(block.columns) || 3 }}>
        {people.map((m, i) => {
          const photo = resolveMedia(m.photo, ctx.origin, m.name)
          return (
            <li key={m.id ?? i} className="team__member">
              {photo?.kind === 'image' ? (
                <MediaFrame media={photo} locale={ctx.locale} ratio="4/5" sizes="(min-width: 900px) 25vw, 60vw" />
              ) : null}
              <h3 className="team__name">{m.name}</h3>
              {m.role ? <p className="team__role">{m.role}</p> : null}
              {m.bio ? <p className="team__bio">{m.bio}</p> : null}
            </li>
          )
        })}
      </ul>
    </>
  )
}

function ContactBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ContactDetails
        locale={ctx.locale}
        info={{
          address: block.address as string,
          phones: block.phones as string[],
          email: block.email as string,
          hours: block.hours as string,
        }}
      />
    </>
  )
}

async function FormBlock({ block, ctx }: { block: Block; ctx: Ctx }) {
  const ref = block.form as Ref<Form>
  const form = typeof ref === 'string' ? await getForm(ref, ctx.locale) : ref
  if (!form?.id || !form.fields?.length) {
    return <p className="muted">{copy[ctx.locale].formUnavailable}</p>
  }
  const messages: Record<number, React.ReactNode> = {}
  form.fields.forEach((f, i) => {
    if (f.blockType === 'message') messages[i] = <RichText data={f.message} locale={ctx.locale} origin={ctx.origin} variant="compact" />
  })
  const confirmation =
    form.confirmationType !== 'redirect' ? (
      <RichText data={form.confirmationMessage} locale={ctx.locale} origin={ctx.origin} variant="compact" />
    ) : null
  return (
    <div className="block-form">
      {block.enableIntro ? (
        <RichText data={block.introContent as RichTextData} locale={ctx.locale} origin={ctx.origin} variant="compact" />
      ) : null}
      <CmsForm form={form} locale={ctx.locale} messages={messages} confirmation={confirmation} />
    </div>
  )
}

async function ArchiveBlock({ block, ctx }: { block: Block; ctx: Ctx }) {
  let posts: Post[] = []
  if (block.populateBy === 'selection') {
    const ids = ((block.selectedDocs as { value?: Ref<Post> }[]) ?? [])
      .map((d) => (typeof d.value === 'string' ? d.value : d.value?.id))
      .filter(Boolean)
    posts = await getPostsByIds(ids.join(','), ctx.locale)
  } else {
    const cats = ((block.categories as Ref<{ id: string }>[]) ?? [])
      .map((c) => (typeof c === 'string' ? c : c?.id))
      .filter((c): c is string => Boolean(c))
    posts = await getPostsForCategories(cats, ctx.locale, Number(block.limit) || 6)
  }
  const entries = (
    await Promise.all(
      posts.map(async (p) => {
        const kind = await sectionOfPost(p, ctx.locale)
        return kind ? toCardEntry(p, kind, ctx.locale, ctx.origin) : null
      }),
    )
  ).filter((e): e is NonNullable<typeof e> => Boolean(e))
  if (!entries.length) return null
  return (
    <>
      <RichText data={block.introContent as RichTextData} locale={ctx.locale} origin={ctx.origin} variant="compact" />
      <EntryGrid entries={entries} locale={ctx.locale} variant="project" />
    </>
  )
}

function FeaturesBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  const items = ((block.items as { id?: string; title?: string; description?: string; icon?: Ref<Media> }[]) ?? []).filter(
    (i) => i.title || i.description,
  )
  if (!items.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ol className="numbered-list" role="list">
        {items.map((item, i) => {
          const image = resolveMedia(item.icon, ctx.origin, item.title)
          return (
            <li key={item.id ?? i} className={`numbered-list__item ${image ? 'has-media' : ''}`}>
              <span className="numbered-list__number num">{indexNumber(i, ctx.locale)}</span>
              <div className="numbered-list__body">
                {item.title ? <h3 className="numbered-list__title">{item.title}</h3> : null}
                {item.description ? <p className="numbered-list__text">{item.description}</p> : null}
              </div>
              {image?.kind === 'image' ? (
                <MediaFrame media={image} locale={ctx.locale} ratio="4/3" sizes="(min-width: 900px) 22vw, 80vw" className="numbered-list__media" />
              ) : null}
            </li>
          )
        })}
      </ol>
    </>
  )
}

function FaqBlock({ block, number }: { block: Block; number?: string }) {
  const items = ((block.items as { id?: string; question?: string; answer?: string }[]) ?? []).filter((i) => i.question)
  if (!items.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <div className="faq">
        {items.map((item, i) => (
          <details key={item.id ?? i} className="faq__item">
            <summary>
              <span>{item.question}</span>
              <span className="faq__icon" aria-hidden="true" />
            </summary>
            {item.answer ? <p className="pre-line">{item.answer}</p> : null}
          </details>
        ))}
      </div>
    </>
  )
}

function CtaBlock({ block, ctx }: { block: Block; ctx: Ctx }) {
  const links = (block.links as { id?: string; link?: LinkField }[]) ?? []
  return (
    <div className="cta">
      <RichText data={block.richText as RichTextData} locale={ctx.locale} origin={ctx.origin} variant="compact" />
      {links.length ? (
        <div className="cta__links">
          {links.map((l, i) => (
            <CmsLink key={l.id ?? i} link={l.link} ctx={ctx} className={l.link?.appearance === 'outline' ? 'button' : 'text-link'} />
          ))}
        </div>
      ) : null}
    </div>
  )
}

function LogosBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  const logos = ((block.logos as Ref<Media>[]) ?? [])
    .map((m) => resolveMedia(m, ctx.origin))
    .filter((m): m is NonNullable<typeof m> => m?.kind === 'image')
  if (!logos.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ul className="logo-grid" role="list">
        {logos.map((logo, i) => (
          <li key={logo.src + i} className="logo-grid__item">
            <MediaFrame media={logo} locale={ctx.locale} ratio="3/2" sizes="(min-width: 900px) 12vw, 40vw" />
          </li>
        ))}
      </ul>
    </>
  )
}

function PricingBlock({ block, ctx, number }: { block: Block; ctx: Ctx; number?: string }) {
  const plans = ((block.plans as {
    id?: string
    name?: string
    featured?: boolean
    price?: number | null
    unit?: string | null
    period?: string | null
    features?: string[] | null
    enableLink?: boolean
    link?: LinkField
  }[]) ?? []).filter((p) => p.name)
  if (!plans.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ul className="pricing" role="list">
        {plans.map((plan, i) => (
          <li key={plan.id ?? i} className={`pricing__plan ${plan.featured ? 'pricing__plan--featured' : ''}`}>
            <h3 className="pricing__name">{plan.name}</h3>
            {typeof plan.price === 'number' ? (
              <p className="pricing__price">
                {plan.price.toLocaleString(ctx.locale === 'fa' ? 'fa-IR' : 'en-US')}
                {plan.unit ? ` ${plan.unit}` : ''}
                {plan.period ? <span className="muted"> / {plan.period}</span> : null}
              </p>
            ) : null}
            {plan.features?.length ? (
              <ul className="pricing__features">
                {plan.features.map((f, j) => (
                  <li key={j}>{f}</li>
                ))}
              </ul>
            ) : null}
            {plan.enableLink && plan.link ? <CmsLink link={plan.link} ctx={ctx} className="button" /> : null}
          </li>
        ))}
      </ul>
    </>
  )
}

function TestimonialsBlock({ block, number }: { block: Block; number?: string }) {
  const items = ((block.items as { id?: string; quote?: string; author?: string; role?: string; avatar?: Ref<Media> }[]) ?? []).filter(
    (i) => i.quote,
  )
  if (!items.length) return null
  return (
    <>
      <SectionHeading number={number} title={block.heading as string} intro={block.intro as string} />
      <ul className="quotes" role="list">
        {items.map((q, i) => (
          <li key={q.id ?? i}>
            <figure className="quote">
              <blockquote>{q.quote}</blockquote>
              {q.author ? (
                <figcaption>
                  {q.author}
                  {q.role ? <span className="muted"> — {q.role}</span> : null}
                </figcaption>
              ) : null}
            </figure>
          </li>
        ))}
      </ul>
    </>
  )
}

const HEADED = new Set(['gallery', 'team', 'contact', 'features', 'faq', 'testimonials', 'logos', 'pricing'])

export function RenderBlocks({
  blocks,
  locale,
  origin,
  allowed,
  numbered = false,
}: {
  blocks: Block[] | null | undefined
  locale: Locale
  origin: string
  /** The site's block allowlist from `GET /api/site`; null when unknown. */
  allowed?: string[] | null
  numbered?: boolean
}) {
  const ctx = { locale, origin }
  let counter = 0
  const list = (blocks ?? []).filter((b) => {
    if (allowed && !allowed.includes(b.blockType)) {
      if (process.env.NODE_ENV !== 'production') console.warn(`[graphite] block "${b.blockType}" not allowed for this site`)
      return false
    }
    return true
  })
  if (!list.length) return null

  return (
    <div className="blocks">
      {list.map((block, i) => {
        const key = block.id ?? `${block.blockType}-${i}`
        const number = numbered && HEADED.has(block.blockType) && block.heading ? indexNumber(counter++, locale) : undefined
        let body: React.ReactNode
        switch (block.blockType) {
          case 'content':
            body = <ContentBlock block={block} ctx={ctx} />
            break
          case 'mediaBlock':
            body = <MediaBlock block={block} ctx={ctx} />
            break
          case 'gallery':
            body = <GalleryBlock block={block} ctx={ctx} number={number} />
            break
          case 'team':
            body = <TeamBlock block={block} ctx={ctx} number={number} />
            break
          case 'contact':
            body = <ContactBlock block={block} ctx={ctx} number={number} />
            break
          case 'formBlock':
            body = <FormBlock block={block} ctx={ctx} />
            break
          case 'archive':
            body = <ArchiveBlock block={block} ctx={ctx} />
            break
          case 'features':
            body = <FeaturesBlock block={block} ctx={ctx} number={number} />
            break
          case 'faq':
            body = <FaqBlock block={block} number={number} />
            break
          case 'cta':
            body = <CtaBlock block={block} ctx={ctx} />
            break
          case 'testimonials':
            body = <TestimonialsBlock block={block} number={number} />
            break
          case 'logos':
            body = <LogosBlock block={block} ctx={ctx} number={number} />
            break
          case 'pricing':
            body = <PricingBlock block={block} ctx={ctx} number={number} />
            break
          default:
            if (process.env.NODE_ENV !== 'production') {
              console.warn(`[graphite] unsupported block "${block.blockType}"`)
            }
            return null
        }
        return (
          <section key={key} className={`block block--${block.blockType}`} data-block={block.blockType}>
            {body}
          </section>
        )
      })}
    </div>
  )
}

/** Blocks whose content belongs in the contact column of a page. */
export const isContactBlock = (b: Block) => b.blockType === 'contact' || b.blockType === 'formBlock'

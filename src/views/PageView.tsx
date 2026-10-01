import Link from 'next/link'

import { RenderBlocks, isContactBlock } from '@/components/content/Blocks'
import { RichText } from '@/components/content/RichText'
import { EmptyState, Notice, PageTitle, SectionHeading } from '@/components/editorial/Editorial'
import { PageShell, sectionActive } from '@/components/layout/PageShell'
import { pageHref } from '@/lib/links'
import { MinimalMap } from '@/components/map/MinimalMap'
import { MediaFrame } from '@/components/media/MediaFrame'
import type { RenderContext } from '@/lib/context'
import { copy, href, otherLocale, sectionNumber } from '@/lib/i18n'
import { resolveMedia } from '@/lib/media'
import { getOffice } from '@/lib/office'
import type { LocaleLink, Page, Section } from '@/lib/types'

function Hero({ page, ctx }: { page: Page; ctx: RenderContext }) {
  const type = page.hero?.type
  if (type !== 'highImpact' && type !== 'mediumImpact') return null
  const media = resolveMedia(page.hero?.media, ctx.origin, page.title ?? '')
  if (!media) return null
  return (
    <div className="page-hero">
      <MediaFrame media={media} locale={ctx.locale} priority sizes="(min-width: 1040px) 960px, 92vw" caption={media.caption} />
    </div>
  )
}

function Lead({ page, ctx }: { page: Page | null; ctx: RenderContext }) {
  if (!page?.hero?.richText) return null
  return <RichText data={page.hero.richText} locale={ctx.locale} origin={ctx.origin} variant="lead" />
}

async function OfficeMap({ ctx, page, heading }: { ctx: RenderContext; page: Page | null; heading?: boolean }) {
  const office = await getOffice(ctx.locale, page)
  if (!office.location) return null
  const t = copy[ctx.locale]
  return (
    <section className="block block--map" aria-label={t.map}>
      {heading ? <SectionHeading title={t.office} /> : null}
      <MinimalMap location={office.location} address={office.contact?.address} locale={ctx.locale} />
    </section>
  )
}

/** Shown when this locale has no translation but the other locale does. */
function MissingTranslation({ ctx, other }: { ctx: RenderContext; other: LocaleLink | null }) {
  const t = copy[ctx.locale]
  if (!other?.available) return <EmptyState>{t.empty}</EmptyState>
  return (
    <Notice
      action={
        <Link className="text-link" href={other.href} hrefLang={otherLocale(ctx.locale)}>
          {t.translationMissingLink} <span className="arrow" aria-hidden="true" />
        </Link>
      }
    >
      {t.translationMissing}
    </Notice>
  )
}

export async function SectionPageView({
  section,
  page,
  ctx,
  language,
}: {
  section: Extract<Section, 'about' | 'services' | 'contact'>
  page: Page | null
  ctx: RenderContext
  language: LocaleLink | null
}) {
  const t = copy[ctx.locale]
  const title = page?.title || t[section]
  const layout = page?.layout ?? []
  const contactBlocks = section === 'contact' ? layout.filter(isContactBlock) : []
  const rest = section === 'contact' ? layout.filter((b) => !isContactBlock(b)) : layout

  return (
    <PageShell locale={ctx.locale} active={sectionActive(ctx.locale, section)} language={language}>
      <div className="container page">
        <PageTitle number={sectionNumber(section, ctx.locale)} eyebrow={t[section]} title={title} lead={<Lead page={page} ctx={ctx} />} />

        {!page ? (
          <MissingTranslation ctx={ctx} other={language} />
        ) : (
          <>
            <Hero page={page} ctx={ctx} />
            {section === 'contact' ? (
              <div className={`contact-layout ${contactBlocks.some((b) => b.blockType === 'formBlock') ? '' : 'contact-layout--solo'}`}>
                <div className="contact-layout__info">
                  <RenderBlocks
                    blocks={contactBlocks.filter((b) => b.blockType === 'contact')}
                    locale={ctx.locale}
                    origin={ctx.origin}
                    allowed={ctx.allowed}
                  />
                  <OfficeMap ctx={ctx} page={page} />
                </div>
                {contactBlocks.some((b) => b.blockType === 'formBlock') ? (
                  <div className="contact-layout__form">
                    <RenderBlocks
                      blocks={contactBlocks.filter((b) => b.blockType === 'formBlock')}
                      locale={ctx.locale}
                      origin={ctx.origin}
                      allowed={ctx.allowed}
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
            <RenderBlocks
              blocks={rest}
              locale={ctx.locale}
              origin={ctx.origin}
              allowed={ctx.allowed}
              numbered={section !== 'contact'}
            />
            {section === 'about' ? <OfficeMap ctx={ctx} page={page} heading /> : null}
          </>
        )}
      </div>
    </PageShell>
  )
}

export function GenericPageView({ page, ctx, language }: { page: Page; ctx: RenderContext; language: LocaleLink | null }) {
  return (
    <PageShell locale={ctx.locale} active={{ path: pageHref(page.slug, ctx.locale), exact: true }} language={language}>
      <div className="container page">
        <PageTitle eyebrow={copy[ctx.locale].home} eyebrowHref={href(ctx.locale)} title={page.title ?? ''} lead={<Lead page={page} ctx={ctx} />} />
        <Hero page={page} ctx={ctx} />
        <RenderBlocks blocks={page.layout} locale={ctx.locale} origin={ctx.origin} allowed={ctx.allowed} />
      </div>
    </PageShell>
  )
}

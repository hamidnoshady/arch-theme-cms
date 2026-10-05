import { RenderBlocks, isContactBlock } from '@/components/content/Blocks'
import { ContactActions } from '@/components/content/ContactDetails'
import { RichText } from '@/components/content/RichText'
import { EmptyState, Notice, PageTitle, SectionHeading, type StateAction } from '@/components/editorial/Editorial'
import { PageShell, sectionActive } from '@/components/layout/PageShell'
import { MinimalMap } from '@/components/map/MinimalMap'
import { MediaFrame } from '@/components/media/MediaFrame'
import type { RenderContext } from '@/lib/context'
import { copy, href, otherLocale, sectionNumber } from '@/lib/i18n'
import { pageHref } from '@/lib/links'
import { resolveMedia } from '@/lib/media'
import { sectionAvailable } from '@/lib/navigation'
import { getOffice, type ContactBlockData } from '@/lib/office'
import { withoutLeadingTitle } from '@/lib/richtext'
import type { SectionState } from '@/lib/route'
import { pageRoleIndex } from '@/lib/theme/sections'
import type { LocaleLink, Page, Section } from '@/lib/types'

/** A hero picture only when the page has one; nothing stands in for an absent image. */
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

/** The hero text, minus a leading heading that only repeats the page title (already the h1). */
function Lead({ page, ctx }: { page: Page | null; ctx: RenderContext }) {
  const data = withoutLeadingTitle(page?.hero?.richText, page?.title)
  if (!data) return null
  return <RichText data={data} locale={ctx.locale} origin={ctx.origin} variant="lead" />
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

/** Where a visitor goes from a section with nothing to show in this language. */
async function sectionActions(section: Section, ctx: RenderContext, language: LocaleLink | null, state: SectionState) {
  const t = copy[ctx.locale]
  const actions: StateAction[] = []
  if (state === 'missing-translation' && language?.available) {
    const other = otherLocale(ctx.locale)
    actions.push({ href: language.href, label: t.translationMissingLink, hrefLang: other })
  }
  if (section !== 'contact' && (await sectionAvailable('contact', ctx.locale))) {
    actions.push({ href: href(ctx.locale, 'contact'), label: t.contact })
  }
  if (await sectionAvailable('projects', ctx.locale)) actions.push({ href: href(ctx.locale, 'projects'), label: t.allProjects })
  actions.push({ href: href(ctx.locale), label: t.home })
  return actions
}

const same = (a: string, b: string) => a.trim().toLocaleLowerCase() === b.trim().toLocaleLowerCase()

/**
 * The contact page as a workflow: the direct actions the CMS gives (write, call), the
 * details and the map beside them, and the site's own form when one is bound. Nothing
 * here is invented — a field the CMS does not have is simply not shown.
 */
function ContactLayout({ page, ctx, prefill }: { page: Page; ctx: RenderContext; prefill?: string }) {
  const layout = page.layout ?? []
  const contacts = layout.filter((b) => b.blockType === 'contact')
  const forms = layout.filter((b) => b.blockType === 'formBlock')
  const roles = pageRoleIndex(ctx.site)
  const first = contacts[0] as ContactBlockData | undefined
  return (
    <div className={`contact-layout ${forms.length ? '' : 'contact-layout--solo'}`}>
      <div className="contact-layout__info">
        {first ? <ContactActions info={first} locale={ctx.locale} /> : null}
        <RenderBlocks blocks={contacts} locale={ctx.locale} origin={ctx.origin} allowed={ctx.allowed} roles={roles} />
        <OfficeMap ctx={ctx} page={page} />
      </div>
      {forms.length ? (
        <div className="contact-layout__form" id="contact-form" tabIndex={-1}>
          <RenderBlocks blocks={forms} locale={ctx.locale} origin={ctx.origin} allowed={ctx.allowed} roles={roles} formPrefill={prefill} />
        </div>
      ) : null}
    </div>
  )
}

export async function SectionPageView({
  section,
  page,
  state,
  ctx,
  language,
  prefill,
}: {
  section: Extract<Section, 'about' | 'services' | 'contact'>
  page: Page | null
  state: SectionState
  ctx: RenderContext
  language: LocaleLink | null
  /** Contact only: a project title carried from a project's inquiry link. */
  prefill?: string
}) {
  const t = copy[ctx.locale]
  const title = page?.title || t[section]
  const layout = page?.layout ?? []
  const rest = section === 'contact' ? layout.filter((b) => !isContactBlock(b)) : layout
  const eyebrow = same(t[section], title) ? undefined : t[section]
  const roles = pageRoleIndex(ctx.site)

  return (
    <PageShell locale={ctx.locale} active={sectionActive(ctx.locale, section)} language={language}>
      <div className="container page">
        <PageTitle number={sectionNumber(section, ctx.locale)} eyebrow={eyebrow} title={title} lead={<Lead page={page} ctx={ctx} />} />

        {!page ? (
          state === 'missing-translation' ? (
            <Notice actions={await sectionActions(section, ctx, language, state)}>{t.translationMissing}</Notice>
          ) : (
            <EmptyState actions={await sectionActions(section, ctx, language, state)}>{t.empty}</EmptyState>
          )
        ) : (
          <>
            <Hero page={page} ctx={ctx} />
            {section === 'contact' ? <ContactLayout page={page} ctx={ctx} prefill={prefill} /> : null}
            <RenderBlocks blocks={rest} locale={ctx.locale} origin={ctx.origin} allowed={ctx.allowed} roles={roles} numbered={section !== 'contact'} />
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
        <RenderBlocks blocks={page.layout} locale={ctx.locale} origin={ctx.origin} allowed={ctx.allowed} roles={pageRoleIndex(ctx.site)} />
      </div>
    </PageShell>
  )
}

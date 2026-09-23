import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Locale } from './types';
import { copy, href } from './i18n';
import { getCategories, getEntries, getEntry, getPage } from './api';
import { Shell, PageTitle, Empty } from '@/components/Shell';
import { Content } from '@/components/Content';
import { Card } from '@/components/Cards';
import { MediaFrame } from '@/components/Media';
import { ContactForm } from '@/components/ContactForm';
import { LocaleDocument } from '@/components/LocaleDocument';
import { pageMetadata, sectionMetadata } from './seo';
import type { Metadata } from 'next';

const numbers: Record<string, string> = {
  about: '01',
  projects: '02',
  services: '03',
  education: '04',
  contact: '05',
};

export async function routeMetadata(
  locale: Locale,
  segments: string[],
): Promise<Metadata> {
  const [section, entrySlug] = segments;
  if (!section || !(section in numbers)) {
    return pageMetadata({ locale });
  }
  if ((section === 'projects' || section === 'education') && entrySlug) {
    const entry = await getEntry(entrySlug, locale);
    if (!entry) return sectionMetadata(locale, section);
    return pageMetadata({
      locale,
      title: `${entry.title} — GRAPHITE`,
      description: entry.excerpt,
      path: `${section}/${entrySlug}`,
    });
  }
  if (section === 'projects' || section === 'education') {
    return sectionMetadata(locale, section);
  }
  const page = await getPage(section, locale);
  const title = page?.seo?.title || page?.title || copy[locale][section as keyof typeof copy.fa];
  return pageMetadata({
    locale,
    title: `${title} — GRAPHITE`,
    description: page?.seo?.description || page?.intro,
    path: section,
  });
}

export async function renderRoute(
  locale: Locale,
  segments: string[],
  query?: { category?: string },
) {
  const [section, slug] = segments;
  const t = copy[locale];
  if (!section || !(section in numbers)) notFound();
  if ((section === 'projects' || section === 'education') && slug) {
    return (
      <Detail locale={locale} kind={section} slug={slug} />
    );
  }
  if (slug) notFound();
  if (section === 'projects' || section === 'education') {
    return (
      <Index locale={locale} kind={section} category={query?.category} />
    );
  }
  const page = await getPage(section, locale);
  return (
    <LocaleDocument locale={locale}>
      <Shell locale={locale} path={section}>
        <div className="container">
          <PageTitle
            number={numbers[section]}
            title={t[section as keyof typeof t] as string}
            intro={page?.intro}
          />
          {section === 'contact' ? (
            <Contact page={page} locale={locale} />
          ) : (
            <>
              <Content blocks={page?.layout} locale={locale} />
              {!page && <Empty locale={locale} />}
            </>
          )}
        </div>
      </Shell>
    </LocaleDocument>
  );
}

async function Index({
  locale,
  kind,
  category,
}: {
  locale: Locale;
  kind: 'projects' | 'education';
  category?: string;
}) {
  const [entries, categories] = await Promise.all([
    getEntries(kind, locale),
    kind === 'projects' ? getCategories(locale) : Promise.resolve([]),
  ]);
  const projectCategories = categories.filter((c) =>
    entries.some(
      (e) =>
        e.category === c.slug ||
        e.category === c.title ||
        e.category === c.id,
    ),
  );
  const filtered =
    category && kind === 'projects'
      ? entries.filter(
          (e) =>
            e.category === category ||
            projectCategories.find((c) => c.slug === category)?.title ===
              e.category,
        )
      : entries;

  const base = href(locale, kind);

  return (
    <LocaleDocument locale={locale}>
      <Shell locale={locale} path={kind}>
        <div className="container">
          <PageTitle number={numbers[kind]} title={copy[locale][kind]} />
          {kind === 'projects' && projectCategories.length > 1 && (
            <nav className="filters" aria-label="Project categories">
              <Link
                href={base}
                className={!category ? 'is-active' : undefined}
                aria-current={!category ? 'true' : undefined}
              >
                {copy[locale].all}
              </Link>
              {projectCategories.map((c) => (
                <Link
                  key={c.id}
                  href={`${base}?category=${encodeURIComponent(c.slug)}`}
                  className={category === c.slug ? 'is-active' : undefined}
                  aria-current={category === c.slug ? 'true' : undefined}
                >
                  {c.title}
                </Link>
              ))}
            </nav>
          )}
          {filtered.length ? (
            <div
              className={`cards ${kind === 'education' ? 'cards--editorial' : ''}`}
            >
              {filtered.map((e) => (
                <Card key={e.id} entry={e} locale={locale} kind={kind} />
              ))}
            </div>
          ) : (
            <Empty locale={locale} />
          )}
        </div>
      </Shell>
    </LocaleDocument>
  );
}

async function Detail({
  locale,
  kind,
  slug,
}: {
  locale: Locale;
  kind: 'projects' | 'education';
  slug: string;
}) {
  const entry = await getEntry(slug, locale);
  if (!entry) notFound();
  const siblings = await getEntries(kind, locale);
  const index = siblings.findIndex((e) => e.slug === slug);
  const related = siblings
    .filter((_, i) => i !== index)
    .slice(0, 2);

  return (
    <LocaleDocument locale={locale}>
      <Shell locale={locale} path={`${kind}/${slug}`}>
        <article className="container detail">
          <PageTitle title={entry.title} intro={entry.excerpt} />
          {entry.metadata && (
            <dl className="metadata">
              {Object.entries(entry.metadata).map(([k, v]) => (
                <div key={k}>
                  <dt>{k}</dt>
                  <dd>{v}</dd>
                </div>
              ))}
            </dl>
          )}
          {entry.featuredImage && (
            <MediaFrame media={entry.featuredImage} priority />
          )}
          <Content blocks={entry.content} locale={locale} />
          {related.length > 0 && (
            <section className="related">
              <h2 className="related-title">
                {kind === 'projects'
                  ? copy[locale].relatedProjects
                  : copy[locale].relatedEducation}
              </h2>
              <div className="cards">
                {related.map((e) => (
                  <Card key={e.id} entry={e} locale={locale} kind={kind} />
                ))}
              </div>
            </section>
          )}
          <Link className="back" href={href(locale, kind)}>
            ← {copy[locale].back} — {copy[locale][kind]}
          </Link>
        </article>
      </Shell>
    </LocaleDocument>
  );
}

function Contact({
  page,
  locale,
}: {
  page: Awaited<ReturnType<typeof getPage>>;
  locale: Locale;
}) {
  const mapLabel = locale === 'fa' ? 'نمایش روی نقشه' : 'Open map';
  return (
    <div className="contact-layout">
      <div>
        {page?.contact?.address && <address>{page.contact.address}</address>}
        {page?.contact?.email && (
          <a href={`mailto:${page.contact.email}`}>{page.contact.email}</a>
        )}
        {page?.contact?.phone && (
          <a href={`tel:${page.contact.phone}`}>{page.contact.phone}</a>
        )}
        {page?.location && (
          <div className="map">
            <div className="map-grid"><i /></div>
            <p>{page.location.address}</p>
            {page.location.mapUrl && (
              <a href={page.location.mapUrl} target="_blank" rel="noreferrer">
                {mapLabel} ↗
              </a>
            )}
          </div>
        )}
      </div>
      <ContactForm locale={locale} formId={page?.formId} />
    </div>
  );
}

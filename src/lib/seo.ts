import type { Metadata } from 'next';
import type { Locale } from './types';
import { copy, href } from './i18n';

const siteName = 'GRAPHITE — Architecture Office';

export function pageMetadata({
  locale,
  title,
  description,
  path = '',
}: {
  locale: Locale;
  title?: string;
  description?: string;
  path?: string;
}) {
  const pageTitle = title || siteName;
  const desc =
    description ||
    (locale === 'fa'
      ? 'دفتر معماری گرافیت'
      : 'Graphite Architecture Office');

  const faPath = href('fa', path);
  const enPath = href('en', path);

  const metadata: Metadata = {
    title: pageTitle,
    description: desc,
    alternates: {
      canonical: faPath,
      languages: {
        fa: faPath,
        en: enPath,
        'x-default': faPath,
      },
    },
    openGraph: {
      title: pageTitle,
      description: desc,
      locale: locale === 'fa' ? 'fa_IR' : 'en_US',
      alternateLocale: locale === 'fa' ? ['en_US'] : ['fa_IR'],
      siteName: 'GRAPHITE',
      type: 'website',
    },
  };

  return metadata;
}

export function sectionMetadata(locale: Locale, section: keyof typeof copy.fa) {
  const title = copy[locale][section];
  return pageMetadata({ locale, title: `${title} — GRAPHITE`, path: section });
}

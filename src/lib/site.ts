import { getSite } from './api';

export type SiteBootstrap = {
  mediaOrigin: string;
  name?: string;
  availableLocales: string[];
  defaultLocale: string;
};

let cached: SiteBootstrap | null | undefined;

export async function loadSite(): Promise<SiteBootstrap | null> {
  if (cached !== undefined) return cached;
  const site = await getSite();
  if (!site) {
    cached = null;
    return null;
  }
  const media = site.media as { origin?: string } | undefined;
  const base =
    process.env.NEXT_PUBLIC_MEDIA_ORIGIN ||
    process.env.ESHOBE_API_URL ||
    process.env.NEXT_PUBLIC_ESHOBE_API_URL ||
    '';
  cached = {
    mediaOrigin: (media?.origin as string) || base.replace(/\/$/, ''),
    name: site.name as string | undefined,
    availableLocales: (site.availableLocales as string[]) || ['fa', 'en'],
    defaultLocale: (site.defaultLocale as string) || 'fa',
  };
  return cached;
}

export function resetSiteCache() {
  cached = undefined;
}

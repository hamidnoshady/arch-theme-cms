import type { MetadataRoute } from 'next';
import { navKeys } from '@/lib/i18n';

const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://example.com';

export default function sitemap(): MetadataRoute.Sitemap {
  const sections = [...navKeys];
  const routes = ['', '/en', ...sections.flatMap((s) => [`/${s}`, `/en/${s}`])];
  return routes.map((path) => ({
    url: `${base.replace(/\/$/, '')}${path || '/'}`,
    lastModified: new Date(),
    changeFrequency: path === '' || path === '/en' ? 'weekly' : 'monthly',
    priority: path === '' || path === '/en' ? 1 : 0.7,
  }));
}

import { renderRoute, routeMetadata } from '@/lib/pages';
import type { Locale } from '@/lib/types';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const slug = (await params).slug;
  return routeMetadata('fa' as Locale, slug);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ category?: string }>;
}) {
  const slug = (await params).slug;
  const query = await searchParams;
  return renderRoute('fa', slug, query);
}

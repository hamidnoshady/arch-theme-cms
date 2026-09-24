import { renderRoute, routeMetadata } from '@/lib/pages';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  return routeMetadata('en', (await params).slug);
}

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string[] }>;
  searchParams: Promise<{ category?: string }>;
}) {
  return renderRoute('en', (await params).slug, await searchParams);
}

import { renderRoute, routeMetadata } from '@/lib/route'

type Props = {
  params: Promise<{ slug: string[] }>
  searchParams: Promise<{ category?: string | string[] }>
}

export async function generateMetadata({ params }: Props) {
  return routeMetadata('en', (await params).slug)
}

export default async function Page({ params, searchParams }: Props) {
  return renderRoute('en', (await params).slug, await searchParams)
}

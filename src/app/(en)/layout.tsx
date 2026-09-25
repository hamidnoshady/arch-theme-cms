import type { Metadata, Viewport } from 'next'

export const dynamic = 'force-dynamic'

import { RootDocument, rootMetadata } from '@/components/layout/RootDocument'

export async function generateMetadata(): Promise<Metadata> {
  return rootMetadata('en')
}

export const viewport: Viewport = { width: 'device-width', initialScale: 1, viewportFit: 'cover', themeColor: '#ffffff' }

export default function EnglishLayout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>
}

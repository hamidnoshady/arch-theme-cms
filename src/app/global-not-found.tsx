import type { Metadata } from 'next'

import { RootDocument } from '@/components/layout/RootDocument'
import { NotFoundView } from '@/views/StatusViews'

export const metadata: Metadata = { title: 'صفحه پیدا نشد', robots: { index: false, follow: false } }

export default function GlobalNotFound() {
  return (
    <RootDocument locale="fa">
      <NotFoundView locale="fa" />
    </RootDocument>
  )
}

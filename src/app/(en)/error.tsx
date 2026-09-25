'use client'

import { ErrorView } from '@/views/StatusViews'

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return <ErrorView locale="en" reset={reset} />
}

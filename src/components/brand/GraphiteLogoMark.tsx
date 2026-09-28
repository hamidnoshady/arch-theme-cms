'use client'

import { graphiteLogoMarkup } from '@/lib/graphite-logo-markup'

type Props = {
  animated?: boolean
  className?: string
}

export function GraphiteLogoMark({ animated = false, className = '' }: Props) {
  return (
    <div
      className={`logo__mark ${className}`.trim()}
      dangerouslySetInnerHTML={{ __html: graphiteLogoMarkup(animated) }}
    />
  )
}

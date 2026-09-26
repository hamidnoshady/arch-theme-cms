'use client'

import logoSvg from '@/assets/graphite-logo'

type Props = {
  animated?: boolean
  className?: string
}

export function GraphiteLogoMark({ animated = false, className = '' }: Props) {
  const html = logoSvg.replace(
    '<svg ',
    `<svg class="${animated ? 'logo--animated' : ''}" `,
  )
  return <div className={`logo__mark ${className}`.trim()} dangerouslySetInnerHTML={{ __html: html }} />
}

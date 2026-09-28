import logoSvg from '@/assets/graphite-logo'

let prepared: string | null = null

/** Trusted local asset only — strips embedded animation CSS and adds theme class hooks. */
const baseMarkup = (): string => {
  if (prepared) return prepared
  let svg = logoSvg.replace(/<style>[\s\S]*?<\/style>/, '')
  svg = svg.replace('<g fill="#1b3556">', '<g class="logo__shade" fill="#1b3556">')
  svg = svg.replace(
    '<g id="cube-lines" fill="none"',
    '<g id="cube-lines" class="logo__strokes" fill="none"',
  )
  let wire = 0
  svg = svg.replace(/<path class="wire[^"]*" pathLength="1"/g, () => {
    const index = wire++
    return `<path pathLength="1" style="--i:${index}"`
  })
  svg = svg.replace('id="GRAPHITE" class="word"', 'id="GRAPHITE" class="logo__wordmark"')
  svg = svg.replace('id="subtitle-lines"', 'id="subtitle-lines" class="logo__subtitle"')
  svg = svg.replace('id="subtitle" class="subtitle"', 'id="subtitle" class="logo__subtitle"')
  prepared = svg
  return svg
}

export const graphiteLogoMarkup = (animated: boolean): string => {
  const markup = baseMarkup()
  const svgClass = animated ? 'logo--animated' : ''
  return markup.replace('<svg ', `<svg class="${svgClass}" `)
}

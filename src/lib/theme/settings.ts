import themeManifest from '../../../eshobe.theme.json'

export type GraphiteRuntimeSettings = {
  introAnimation: boolean
  introDurationMs: number
  showSectionNumbers: boolean
  mapStyle: 'minimal' | 'osm'
}

const defaults: GraphiteRuntimeSettings = {
  introAnimation: true,
  introDurationMs: 7000,
  showSectionNumbers: true,
  mapStyle: 'minimal',
}

type ManifestRuntime = {
  introAnimation?: boolean
  introDuration?: number
  showSectionNumbers?: boolean
  mapStyle?: string
}

const manifestSettings = (themeManifest as { runtimeSettings?: { defaults?: ManifestRuntime } }).runtimeSettings
  ?.defaults

/** Opinionated Graphite presentation settings (manifest defaults + optional CMS override). */
export function resolveRuntimeSettings(
  siteSettings?: Record<string, unknown> | null,
): GraphiteRuntimeSettings {
  const fromManifest = manifestSettings ?? {}
  const fromSite = siteSettings ?? {}
  const introDuration =
    typeof fromSite.introDuration === 'number'
      ? fromSite.introDuration
      : typeof fromManifest.introDuration === 'number'
        ? fromManifest.introDuration
        : defaults.introDurationMs

  const mapRaw = String(fromSite.mapStyle ?? fromManifest.mapStyle ?? defaults.mapStyle)
  const mapStyle = mapRaw === 'osm' ? 'osm' : 'minimal'

  return {
    introAnimation:
      typeof fromSite.introAnimation === 'boolean'
        ? fromSite.introAnimation
        : typeof fromManifest.introAnimation === 'boolean'
          ? fromManifest.introAnimation
          : defaults.introAnimation,
    introDurationMs: Math.min(20_000, Math.max(0, introDuration)),
    showSectionNumbers:
      typeof fromSite.showSectionNumbers === 'boolean'
        ? fromSite.showSectionNumbers
        : typeof fromManifest.showSectionNumbers === 'boolean'
          ? fromManifest.showSectionNumbers
          : defaults.showSectionNumbers,
    mapStyle,
  }
}

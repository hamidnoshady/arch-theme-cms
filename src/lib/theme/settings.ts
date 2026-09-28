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

type ManifestSettings = Record<string, { default?: unknown }>

/** Defaults come from the manifest's `settings` schema — the single source the CMS validates against. */
const manifestDefaults = (themeManifest as { settings?: ManifestSettings }).settings ?? {}
const manifestSettings = {
  introAnimation: manifestDefaults.introAnimation?.default as boolean | undefined,
  introDuration: manifestDefaults.introDuration?.default as number | undefined,
  showSectionNumbers: manifestDefaults.showSectionNumbers?.default as boolean | undefined,
  mapStyle: manifestDefaults.mapStyle?.default as string | undefined,
}

/** Opinionated Graphite presentation settings (manifest defaults + optional CMS override). */
export function resolveRuntimeSettings(
  siteSettings?: Record<string, unknown> | null,
): GraphiteRuntimeSettings {
  const fromManifest = manifestSettings
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

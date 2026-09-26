import { copy } from '@/lib/i18n'
import { DEFAULT_TILE_URL, tileGrid, type MapLocation } from '@/lib/map'
import type { Locale } from '@/lib/types'

const CANVAS_W = 1280
const CANVAS_H = 640

/**
 * A static, grayscale tile composition centred on a verified location. No map
 * library, no script, no tracking; the full interactive map opens externally.
 */
export function MinimalMap({
  location,
  address,
  locale,
}: {
  location: MapLocation
  address?: string | null
  locale: Locale
}) {
  const t = copy[locale]
  const grid = tileGrid(location, location.zoom, CANVAS_W, CANVAS_H)
  const custom = Boolean(process.env.MAP_TILE_URL?.trim() && process.env.MAP_TILE_URL.trim() !== DEFAULT_TILE_URL)
  const label = address ? `${t.map} — ${address}` : t.map

  return (
    <figure className="map">
      <div className="map__frame">
        <div className="map__viewport" role="img" aria-label={label}>
          <div
            className="map__tiles"
            style={{ width: CANVAS_W, height: CANVAS_H }}
          >
            {grid.tiles.map((tile) => (
              // eslint-disable-next-line @next/next/no-img-element -- raster map tiles
              <img
                key={`${tile.x}-${tile.y}-${tile.left}`}
                src={tile.src}
                alt=""
                width={256}
                height={256}
                loading="lazy"
                decoding="async"
                referrerPolicy="strict-origin-when-cross-origin"
                style={{ left: tile.left + grid.offsetX, top: tile.top + grid.offsetY }}
              />
            ))}
          </div>
          <span className="map__marker" aria-hidden="true" />
        </div>
      </div>
      <figcaption className="map__caption">
        {address ? <address className="map__address">{address}</address> : null}
        <a className="text-link" href={location.url} target="_blank" rel="noopener noreferrer">
          {t.openMap} <span className="arrow arrow--external" aria-hidden="true" />
        </a>
        <small className="map__credit" dir="ltr">
          {custom ? t.mapAttribution : '© OpenStreetMap contributors © CARTO'}
        </small>
      </figcaption>
    </figure>
  )
}

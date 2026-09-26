/**
 * The CMS has no coordinates field. An office location is only shown when an
 * editor has linked to it from CMS content with a map URL that carries explicit
 * coordinates (OpenStreetMap, Google Maps, Neshan, Balad or `geo:`). Nothing is
 * geocoded or guessed.
 */

export type MapLocation = { lat: number; lng: number; url: string; zoom: number }

const HOSTS =
  /(^|\.)(openstreetmap\.org|google\.[a-z.]+|goo\.gl|maps\.app\.goo\.gl|neshan\.org|balad\.ir|bing\.com|apple\.com|osm\.org)$/i

const valid = (lat: number, lng: number) =>
  Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180 && !(lat === 0 && lng === 0)

function pair(value: string | null | undefined): [number, number] | null {
  const m = value?.match(/^\s*(-?\d{1,3}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)/)
  if (!m) return null
  const lat = Number(m[1])
  const lng = Number(m[2])
  return valid(lat, lng) ? [lat, lng] : null
}

export function parseMapUrl(raw: string | null | undefined): MapLocation | null {
  if (!raw) return null
  const input = raw.trim()

  if (/^geo:/i.test(input)) {
    const p = pair(input.slice(4))
    return p ? { lat: p[0], lng: p[1], url: input, zoom: 16 } : null
  }

  let url: URL
  try {
    url = new URL(input)
  } catch {
    return null
  }
  if (!/^https?:$/.test(url.protocol) || !HOSTS.test(url.hostname)) return null

  const q = url.searchParams
  const zoomParam = Number(q.get('zoom') || q.get('z'))
  const zoom = Number.isFinite(zoomParam) && zoomParam >= 3 && zoomParam <= 19 ? Math.round(zoomParam) : 16
  const found = (lat: number, lng: number, z = zoom): MapLocation | null =>
    valid(lat, lng) ? { lat, lng, url: input, zoom: z } : null

  const mlat = q.get('mlat') ?? q.get('lat') ?? q.get('latitude')
  const mlon = q.get('mlon') ?? q.get('lng') ?? q.get('lon') ?? q.get('longitude')
  if (mlat && mlon) return found(Number(mlat), Number(mlon))

  for (const key of ['q', 'query', 'll', 'center', 'destination', 'sll']) {
    const p = pair(q.get(key))
    if (p) return found(p[0], p[1])
  }

  const hashMap = url.hash.match(/map=(\d{1,2})\/(-?\d+(?:\.\d+)?)\/(-?\d+(?:\.\d+)?)/)
  if (hashMap) return found(Number(hashMap[2]), Number(hashMap[3]), Math.min(Number(hashMap[1]), 19))

  const at = `${url.pathname}${url.hash}`.match(/@(-?\d{1,3}\.\d+),(-?\d{1,3}\.\d+)(?:,(\d{1,2}(?:\.\d+)?)z)?/)
  if (at) {
    const z = at[3] ? Math.min(Math.round(Number(at[3])), 19) : zoom
    return found(Number(at[1]), Number(at[2]), z)
  }

  return null
}

export const isMapUrl = (url: string | null | undefined) => Boolean(parseMapUrl(url))

export type TileGrid = {
  zoom: number
  tiles: { x: number; y: number; left: number; top: number; src: string }[]
  /** Pixel offset of the grid so the location sits at the frame centre. */
  offsetX: number
  offsetY: number
  width: number
  height: number
}

const TILE = 256
export const DEFAULT_TILE_URL = 'https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'

/** Web-Mercator tiles covering a `width × height` frame centred on the location. */
export function tileGrid(
  loc: Pick<MapLocation, 'lat' | 'lng'>,
  zoom: number,
  width: number,
  height: number,
  template = process.env.MAP_TILE_URL?.trim() || DEFAULT_TILE_URL,
): TileGrid {
  const n = 2 ** zoom
  const px = ((loc.lng + 180) / 360) * n * TILE
  const latRad = (loc.lat * Math.PI) / 180
  const py = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE

  const left = px - width / 2
  const top = py - height / 2
  const x0 = Math.floor(left / TILE)
  const y0 = Math.floor(top / TILE)
  const x1 = Math.floor((left + width) / TILE)
  const y1 = Math.floor((top + height) / TILE)

  const tiles: TileGrid['tiles'] = []
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) {
      if (y < 0 || y >= n) continue
      const wrapped = ((x % n) + n) % n
      tiles.push({
        x: wrapped,
        y,
        left: (x - x0) * TILE,
        top: (y - y0) * TILE,
        src: template
          .replace('{z}', String(zoom))
          .replace('{x}', String(wrapped))
          .replace('{y}', String(y))
          .replace('{r}', '@2x')
          .replace('{s}', 'a'),
      })
    }
  }
  return {
    zoom,
    tiles,
    offsetX: Math.round(x0 * TILE - left),
    offsetY: Math.round(y0 * TILE - top),
    width,
    height,
  }
}

import { describe, expect, it } from 'vitest'

import { parseMapUrl, tileGrid } from './map'

describe('parseMapUrl', () => {
  it('reads OpenStreetMap query coordinates', () => {
    const loc = parseMapUrl('https://www.openstreetmap.org/?mlat=35.7219&mlon=51.3347#map=16/35.7219/51.3347')
    expect(loc?.lat).toBeCloseTo(35.7219)
    expect(loc?.lng).toBeCloseTo(51.3347)
  })

  it('reads a Google Maps @lat,lng pin', () => {
    const loc = parseMapUrl('https://www.google.com/maps/@35.70,51.40,17z')
    expect(loc).toMatchObject({ lat: 35.7, lng: 51.4, zoom: 17 })
  })

  it('reads a geo URI and rejects addresses without coordinates', () => {
    expect(parseMapUrl('geo:35.72,51.33')?.lat).toBeCloseTo(35.72)
    expect(parseMapUrl('https://www.google.com/maps/search/Tehran')).toBeNull()
    expect(parseMapUrl('https://example.com/?mlat=35&mlon=51')).toBeNull()
    expect(parseMapUrl('not a url')).toBeNull()
  })
})

describe('tileGrid', () => {
  it('covers the frame and centres it on the point', () => {
    const grid = tileGrid({ lat: 35.72, lng: 51.33 }, 3, 400, 200, 'https://tiles.example/{z}/{x}/{y}.png')
    expect(grid.tiles.length).toBeGreaterThan(0)
    expect(grid.tiles[0]!.src).toMatch(/^https:\/\/tiles\.example\/3\//)
    const centreX = 200 - grid.offsetX
    const centreY = 100 - grid.offsetY
    expect(centreX).toBeGreaterThan(0)
    expect(centreY).toBeGreaterThan(0)
  })
})

import { describe, expect, it } from 'vitest'

import { locationFromContact } from './office'

describe('locationFromContact', () => {
  it('uses structured latitude and longitude when provided', () => {
    const loc = locationFromContact({ latitude: 35.6892, longitude: 51.389, address: 'Tehran' })
    expect(loc?.lat).toBeCloseTo(35.6892)
    expect(loc?.lng).toBeCloseTo(51.389)
  })

  it('falls back to a safe map URL on the contact block', () => {
    const loc = locationFromContact({
      mapUrl: 'https://www.openstreetmap.org/?mlat=35.7&mlon=51.4',
      address: 'Tehran',
    })
    expect(loc?.lat).toBeCloseTo(35.7)
  })
})

import { afterEach, describe, expect, it } from 'vitest'
import {
  canonicalOrigin,
  cmsOrigin,
  cmsRequestHeaders,
  publicOrigin,
  siteApiKey,
  siteDomain,
} from './env'

const KEYS = [
  'ESHOBE_CMS_URL',
  'ESHOBE_API_URL',
  'NEXT_PUBLIC_ESHOBE_API_URL',
  'ESHOBE_API_KEY',
  'ESHOBE_SITE_API_KEY',
  'ESHOBE_SITE_DOMAIN',
  'ESHOBE_PUBLIC_ORIGIN',
  'NEXT_PUBLIC_SITE_URL',
  'ESHOBE_REVALIDATE_SECRET',
]

afterEach(() => {
  for (const key of KEYS) delete process.env[key]
})

describe('platform env contract', () => {
  it('prefers ESHOBE_CMS_URL over legacy aliases', () => {
    process.env.ESHOBE_API_URL = 'https://legacy.example'
    process.env.ESHOBE_CMS_URL = 'https://cms.example/'
    expect(cmsOrigin()).toBe('https://cms.example')
  })

  it('falls back to ESHOBE_API_URL for manual Coolify deploys', () => {
    process.env.ESHOBE_API_URL = 'https://legacy.example/'
    expect(cmsOrigin()).toBe('https://legacy.example')
  })

  it('prefers ESHOBE_API_KEY over ESHOBE_SITE_API_KEY', () => {
    process.env.ESHOBE_SITE_API_KEY = 'old'
    process.env.ESHOBE_API_KEY = 'platform'
    expect(siteApiKey()).toBe('platform')
  })

  it('names the tenant with the key and keeps the CMS Host when a key is set', () => {
    // Rewriting Host to the customer domain makes Coolify's proxy route the call back
    // into this theme (or nowhere): the site renders empty after a timeout.
    process.env.ESHOBE_API_KEY = 'k'
    process.env.ESHOBE_SITE_DOMAIN = 'https://acme.ir/'
    expect(siteDomain()).toBe('acme.ir')
    expect(cmsRequestHeaders()).toEqual({
      Accept: 'application/json',
      Authorization: 'Bearer k',
    })
  })

  it('falls back to Host as the tenant without a key', () => {
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    expect(cmsRequestHeaders()).toEqual({ Accept: 'application/json', Host: 'acme.ir' })
  })

  it('uses public origin for preview links and site domain for canonicals', () => {
    process.env.ESHOBE_PUBLIC_ORIGIN = 'https://acme.sites.example/'
    process.env.ESHOBE_SITE_DOMAIN = 'acme.ir'
    expect(publicOrigin()).toBe('https://acme.sites.example')
    expect(canonicalOrigin()).toBe('https://acme.ir')
  })
})

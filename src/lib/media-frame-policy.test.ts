import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

const read = (...segments: string[]) => readFileSync(path.join(process.cwd(), ...segments), 'utf8')

/** Comments carry the rationale; policy checks apply to declarations only. */
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, '')

const css = (...segments: string[]) => stripComments(read('src', 'styles', ...segments))
const component = (...segments: string[]) => read('src', 'components', ...segments)

describe('media frame policy', () => {
  it('pulses the placeholder behind the picture, never the picture itself', () => {
    const skeleton = css('skeleton.css')
    expect(skeleton).toMatch(/\.frame__media::before\s*\{[^}]*animation:\s*skeleton-pulse/)
    // `.frame__media` is every image on the site: animating it made loaded photographs
    // pulse forever, which is the bug this policy exists to prevent.
    expect(skeleton).not.toMatch(/\.frame__media\s*\{[^}]*animation:/)
    expect(skeleton).not.toMatch(/\.picture\s*\{[^}]*animation:/)
  })

  it('paints the placeholder behind the image and lifts the image over it', () => {
    const media = css('media.css')
    expect(media).toMatch(/\.frame__media\s*\{[^}]*position:\s*relative/)
    expect(media).toMatch(/\.frame__media::before\s*\{[^}]*position:\s*absolute/)
    expect(media).toMatch(/\.frame__media > \.picture,[\s\S]{0,80}\.frame__media > \.video\s*\{[^}]*z-index:\s*1/)
  })

  it('sizes a natural frame to the picture it holds', () => {
    const media = css('media.css')
    expect(media).toMatch(/\.frame--natural\s*\{[^}]*calc\(68dvh \* var\(--media-ar/)
    expect(media).toMatch(/\.frame--natural > \.frame__media\s*\{[^}]*width:\s*min\(100%/)
  })

  it('publishes the media ratio and marks a natural frame', () => {
    const frame = component('media', 'MediaFrame.tsx')
    expect(frame).toMatch(/--media-ar/)
    expect(frame).toMatch(/frame--natural/)
    expect(frame).toMatch(/frame--fixed/)
  })

  it('leaves the hero column to the layout and the frame to the picture', () => {
    const content = css('content.css')
    expect(content).toMatch(/\.page-hero,\s*\.entry__hero\s*\{[^}]*width:\s*min\(100%,\s*960px\)/)
    // The 68dvh cap used to live only in content.css, so the picture shrank while the
    // frame stayed the width of the column — the empty plate in the bug report.
    expect(content).not.toMatch(/max-height:\s*68dvh/)
  })
})

describe('route loading policy', () => {
  it('gives content routes no streaming boundary, so a missing slug answers 404, not 200', () => {
    // A `loading.tsx` above `[...slug]` flushes a 200 before the route can call notFound(),
    // and its silhouette drew a hero image on pages that have none.
    // A boundary on a parent segment wraps the slug route too, so none may sit above it.
    for (const route of [['(fa)', '[...slug]'], ['(en)', 'en', '[...slug]'], ['(fa)'], ['(en)', 'en'], ['(en)']]) {
      expect(() => read('src', 'app', ...route, 'loading.tsx')).toThrow()
    }
    // The home skeleton is scoped to the home route by a route group.
    expect(read('src', 'app', '(fa)', '(home)', 'loading.tsx')).toMatch(/HomeSkeleton/)
    expect(read('src', 'app', '(en)', 'en', '(home)', 'loading.tsx')).toMatch(/HomeSkeleton/)
  })

  it('stands in for the home stage instead of an interior card grid', () => {
    const home = component('layout', 'HomeSkeleton.tsx')
    expect(home).toMatch(/className="home"/)
    expect(home).toMatch(/home__center/)
    expect(home).not.toMatch(/entry-grid/)
  })

  it('announces loading in the visitor’s language', () => {
    expect(component('layout', 'HomeSkeleton.tsx')).toMatch(/copy\[locale\]\.loading/)
  })

  it('defines every skeleton modifier the loading state uses', () => {
    const cssText = css('skeleton.css')
    const used = [...new Set([...component('layout', 'HomeSkeleton.tsx').matchAll(/skeleton--[a-z-]+/g)].map((m) => m[0]))]
    expect(used.length).toBeGreaterThan(1)
    for (const name of used) expect(cssText, name).toMatch(new RegExp(`\\.${name}\\s*[,{]`))
  })
})

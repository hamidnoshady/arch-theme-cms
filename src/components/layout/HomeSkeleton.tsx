import { copy } from '@/lib/i18n'
import type { Locale } from '@/lib/types'

/**
 * Loading state for the home route.
 *
 * Home is a single fixed screen — the mark, then the navigation it reveals — so its
 * placeholder is that screen with the two objects standing in. A card grid used to
 * stand here instead: it announced interior content on a route that never shows any,
 * and the whole screen then changed shape when the real stage arrived.
 *
 * `.home` is reused exactly as the stage uses it (fixed, non-scrolling), so the
 * skeleton and the stage occupy the same screen at every width.
 */
export function HomeSkeleton({ locale = 'fa' }: { locale?: Locale }) {
  return (
    <div className="home" aria-busy="true">
      <span className="sr-only" role="status">
        {copy[locale].loading}
      </span>
      <div className="home__center">
        <div className="home__stack">
          <span className="skeleton skeleton--wordmark" />
          <span className="skeleton skeleton--nav" />
        </div>
      </div>
    </div>
  )
}

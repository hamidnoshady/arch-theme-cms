import { copy } from '@/lib/i18n'
import type { Locale } from '@/lib/types'

/** Route-level loading state: the page's silhouette (header bar, title, one media block, a few text lines). */
export function PageSkeleton({ locale = 'fa' }: { locale?: Locale }) {
  return (
    <div className="shell" aria-busy="true">
      {/* One announcement, in the visitor's language: the blocks below are decoration. */}
      <span className="sr-only" role="status">
        {copy[locale].loading}
      </span>
      <div className="site-header skeleton-header">
        <div className="site-header__inner">
          <span className="skeleton skeleton--logo" />
          <span className="skeleton skeleton--line skeleton-header__nav" />
        </div>
      </div>
      {/* The page's own frame: same container, same `.page` rhythm, same measure. */}
      <main className="shell__main">
        <div className="container page">
          <div className="page-skeleton__title">
            <span className="skeleton skeleton--line skeleton--eyebrow" />
            <span className="skeleton skeleton--line skeleton--title" />
          </div>
          <span className="skeleton skeleton--media" />
          <div className="skeleton-text">
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line" />
            <span className="skeleton skeleton--line skeleton--short" />
          </div>
        </div>
      </main>
    </div>
  )
}

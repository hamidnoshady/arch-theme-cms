/** Route-level loading state: the page's silhouette (header bar, title, one media block, a few text lines). */
export function PageSkeleton() {
  return (
    <div className="shell" aria-busy="true">
      <div className="site-header skeleton-header">
        <div className="site-header__inner">
          <span className="skeleton skeleton--logo" />
          <span className="skeleton skeleton--line skeleton-header__nav" />
        </div>
      </div>
      <main className="shell__main skeleton-page">
        <span className="skeleton skeleton--line skeleton--eyebrow" />
        <span className="skeleton skeleton--line skeleton--title" />
        <span className="skeleton skeleton--media" />
        <div className="skeleton-text">
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line" />
          <span className="skeleton skeleton--line skeleton--short" />
        </div>
      </main>
    </div>
  )
}

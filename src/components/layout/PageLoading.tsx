/** Route-level loading state: three empty boxes on the card grid, pulsing until the page lands. */
export function PageLoading() {
  return (
    <main className="page-loading" aria-busy="true" aria-label="Loading">
      <ul className="entry-grid" role="list">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="card">
              <div className="card__link">
                <span className="frame frame--inset frame--fixed frame--empty" style={{ ['--ratio' as string]: '4/3' }}>
                  <span className="frame__media" />
                </span>
                <span className="card__body" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </main>
  )
}

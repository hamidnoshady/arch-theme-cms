/**
 * Does this link activation start a page change?
 *
 * `RouteProgress` shows the route rule from the moment a link is activated, before
 * the router has replied, so this has to agree with the browser about what counts as
 * leaving this document — otherwise a new tab or a download would raise a rule that
 * nothing ever finishes. It also keeps the decision pure, which is the only part of
 * the indicator worth testing without a DOM.
 */
export type LinkActivation = {
  /** The anchor's href — absolute in the browser, and resolved against `current` if not. */
  href: string
  /** The document the activation happened in. */
  current: string
  /** Modifier-click or middle-click: the browser's call, not the router's. */
  modified?: boolean
  /** `target`, when the anchor sets one — a new tab is not a page change. */
  target?: string | null
  /** `download` present: the anchor is a file, not a route. */
  download?: boolean
}

export function startsPageChange({ href, current, modified, target, download }: LinkActivation): boolean {
  if (modified || target || download) return false

  let from: URL
  let to: URL
  try {
    from = new URL(current)
    to = new URL(href, from)
  } catch {
    // A document that cannot be parsed, or an href that cannot be resolved
    // against it, is not a route.
    return false
  }

  if (to.origin !== from.origin) return false
  // Same path *and* same query means the same page: an in-page anchor, or a link to
  // where the visitor already is. A query-only change is a real one — the section
  // indexes filter through `?category=…`.
  return to.pathname !== from.pathname || to.search !== from.search
}

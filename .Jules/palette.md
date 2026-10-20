## 2026-09-30 - [Smooth Anchor Keyboard Navigation]
**Learning:** Native browser smooth scroll behavior intercepts link clicks and often breaks standard accessibility focus management for in-page anchors when the target doesn't explicitly have a `tabindex` set. This prevents keyboard/screen reader users from continuing navigation from the anchor target.
**Action:** When overriding or handling smooth scrolling manually for same-page anchors, ensure the target element is made focusable programmatically (e.g., adding `tabindex="-1"`) and actively set focus to it.
## 2024-05-18 - Added title attributes to icon-only buttons
**Learning:** Icon-only buttons with `aria-label` are accessible to screen readers, but sighted users may still not understand what the button does. Adding a `title` attribute provides a native tooltip that acts as a helpful hint.
**Action:** Always add `title` attributes alongside `aria-label` to icon-only buttons to provide a native tooltip for sighted users.

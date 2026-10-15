## 2026-09-30 - [Smooth Anchor Keyboard Navigation]
**Learning:** Native browser smooth scroll behavior intercepts link clicks and often breaks standard accessibility focus management for in-page anchors when the target doesn't explicitly have a `tabindex` set. This prevents keyboard/screen reader users from continuing navigation from the anchor target.
**Action:** When overriding or handling smooth scrolling manually for same-page anchors, ensure the target element is made focusable programmatically (e.g., adding `tabindex="-1"`) and actively set focus to it.

## 2026-10-15 - Native Tooltips for Icon-Only Buttons
**Learning:** Icon-only buttons often have `aria-label` for screen readers, but lack visible tooltips for sighted users navigating via mouse. Adding `title` attributes that mirror the `aria-label` provides a simple, native way to expose this context without requiring custom tooltip components.
**Action:** When adding or reviewing icon-only buttons, consistently apply `title` attributes matching the `aria-label` to ensure context is accessible to all users.

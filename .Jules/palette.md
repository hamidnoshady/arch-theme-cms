## 2026-09-30 - [Smooth Anchor Keyboard Navigation]
**Learning:** Native browser smooth scroll behavior intercepts link clicks and often breaks standard accessibility focus management for in-page anchors when the target doesn't explicitly have a `tabindex` set. This prevents keyboard/screen reader users from continuing navigation from the anchor target.
**Action:** When overriding or handling smooth scrolling manually for same-page anchors, ensure the target element is made focusable programmatically (e.g., adding `tabindex="-1"`) and actively set focus to it.

## 2026-10-04 - [Unused Visual Micro-UX Classes]
**Learning:** Sometimes perfect micro-UX enhancements exist as unused utility classes in the CSS (like `arrow--external` in `base.css`), indicating a planned but missed accessibility/UX cue during implementation.
**Action:** Always check existing stylesheets for unused semantic classes related to the component before writing custom visual indicators or assuming the pattern doesn't exist.

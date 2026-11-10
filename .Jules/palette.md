## 2026-09-30 - [Smooth Anchor Keyboard Navigation]
**Learning:** Native browser smooth scroll behavior intercepts link clicks and often breaks standard accessibility focus management for in-page anchors when the target doesn't explicitly have a `tabindex` set. This prevents keyboard/screen reader users from continuing navigation from the anchor target.
**Action:** When overriding or handling smooth scrolling manually for same-page anchors, ensure the target element is made focusable programmatically (e.g., adding `tabindex="-1"`) and actively set focus to it.

## 2024-05-13 - Add titles mirroring aria-labels to icon buttons
**Learning:** Native browser tooltips (`title` attribute) provide immediate visual context for users who are not using screen readers but may not understand what an icon means.
**Action:** Always add a `title` attribute matching the `aria-label` to icon-only buttons to support cognitive accessibility and improve usability.

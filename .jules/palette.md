## 2024-03-24 - Provide Title Attributes for Icon-Only and Abbreviated Buttons
**Learning:** While `aria-label` is sufficient for screen readers, sighted users often rely on tooltips to understand icon-only buttons (e.g., hamburger menu, close buttons) or short abbreviated links (e.g., "EN" / "فا" language switches).
**Action:** Always add a `title` attribute matching the `aria-label` or visually hidden text for icon-only buttons and short abbreviations to ensure a tooltip is shown on hover, improving usability for sighted users.

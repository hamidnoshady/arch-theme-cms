## 2024-03-24 - Debouncing Global MutationObserver Scans
**Learning:** When using `MutationObserver` for global DOM node changes to detect elements (like `[data-reveal]`), immediate execution of `document.querySelectorAll` on every mutation can cause layout thrashing and O(N) traversals multiple times per frame on frequent React micro-mutations.
**Action:** Always debounce heavy DOM query operations triggered by `MutationObserver` using `requestAnimationFrame`.

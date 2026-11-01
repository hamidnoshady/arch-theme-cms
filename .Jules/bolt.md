## 2025-02-25 - MutationObserver Layout Thrashing
**Learning:** Broad MutationObservers (childList/subtree on body) can trigger `document.querySelectorAll` multiple times per frame on frequent React micro-mutations, leading to O(N) traversals and severe layout thrashing.
**Action:** Debounce these generic, heavy DOM-scanning MutationObserver callbacks using `requestAnimationFrame` to batch operations.

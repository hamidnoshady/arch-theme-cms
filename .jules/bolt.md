## 2026-10-24 - Debouncing Global MutationObservers
**Learning:** Using an un-debounced MutationObserver tracking `document.body` for `childList` and `subtree` changes that synchronously runs `document.querySelectorAll` creates severe layout thrashing and O(N) traversals multiple times per frame, especially due to frequent React micro-mutations.
**Action:** Always wrap expensive DOM queries (like `querySelectorAll`) triggered by global `MutationObservers` in `requestAnimationFrame` to batch execution and prevent main thread blocking.

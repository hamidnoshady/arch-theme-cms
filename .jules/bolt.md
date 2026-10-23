## 2024-10-24 - Debouncing Global DOM Queries in MutationObserver
**Learning:** Using `MutationObserver` on `document.body` for global changes without debouncing can trigger heavy operations like `document.querySelectorAll` multiple times per frame on frequent React micro-mutations, leading to severe layout thrashing and O(N) traversals.
**Action:** Always debounce global DOM queries in a `MutationObserver` using `requestAnimationFrame` when integrating with React apps to limit traversals to once per frame and prevent layout thrashing.

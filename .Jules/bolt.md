## 2025-02-23 - Debounce MutationObserver in React applications
**Learning:** `MutationObserver` on `document.body` monitoring React micro-mutations can trigger heavily due to frequent small updates. Without debouncing, traversing the DOM with `document.querySelectorAll` multiple times in a single frame wastes substantial CPU resources.
**Action:** Always debounce `MutationObserver` handlers traversing large DOM segments (e.g., using `requestAnimationFrame`) to prevent layout thrashing and process batch updates cleanly per frame. Remember to clear animation frames on unmount.

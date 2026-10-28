## 2025-02-28 - MutationObserver Layout Thrashing
**Learning:** Using `MutationObserver` to perform un-debounced `document.querySelectorAll` synchronous scans on `document.body` mutations causes severe layout thrashing in React applications during re-renders, where each micro-mutation triggers an O(N) DOM traversal blocking the main thread.
**Action:** When implementing global DOM observers that perform heavy tree traversals, always debounce the callback using `requestAnimationFrame`. In TypeScript strict mode, type the frame ID as `number | undefined` and ensure it is cleared on unmount.

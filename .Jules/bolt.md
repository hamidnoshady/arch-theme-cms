## 2024-05-24 - Debouncing DOM Scans in MutationObservers
**Learning:** Unthrottled `MutationObserver` callbacks executing heavy operations like `document.querySelectorAll` across the whole document on every DOM mutation can cause massive layout thrashing and O(N) traversals multiple times per frame, severely degrading performance.
**Action:** Always debounce global DOM scans triggered by `MutationObserver`s using `requestAnimationFrame`. Ensure the `rafId` is properly typed as `number | undefined` and check for its existence before cancelling to avoid TypeScript errors in strict mode.

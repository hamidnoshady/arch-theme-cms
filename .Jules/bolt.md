## 2024-05-24 - Debouncing Global MutationObserver Scans
**Learning:** Using `MutationObserver` on `document.body` for global DOM changes (like `[data-reveal]`) can trigger heavy operations like `document.querySelectorAll` multiple times per frame on frequent React micro-mutations, causing layout thrashing and poor performance.
**Action:** Always debounce heavy DOM queries triggered by `MutationObserver` using `requestAnimationFrame` to ensure they run at most once per frame. Ensure the animation frame ID is typed as `number | undefined` in TypeScript strict mode and cleared on unmount.

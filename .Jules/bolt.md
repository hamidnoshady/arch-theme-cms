## 2026-11-02 - MutationObserver Debouncing
**Learning:** Using `MutationObserver` to watch `document.body` for React micro-mutations can cause extreme layout thrashing and O(N) queries if operations like `document.querySelectorAll` are run synchronously on every mutation.
**Action:** Always debounce global DOM queries inside `MutationObserver` callbacks using `requestAnimationFrame`. In strict TS, type the RAF ID as `number | undefined` and check for undefined before calling `cancelAnimationFrame`.

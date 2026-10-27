## 2025-02-28 - Debounce MutationObserver with requestAnimationFrame
**Learning:** In a React application, a global `MutationObserver` on `document.body` that executes expensive operations like `document.querySelectorAll` synchronously can cause layout thrashing and extreme performance degradation during React's frequent micro-mutations.
**Action:** Always debounce global DOM scan operations triggered by `MutationObserver` using `requestAnimationFrame`. Remember to type the ID variable as `number | undefined` and handle cancellation in the cleanup phase to prevent memory leaks and TS errors.

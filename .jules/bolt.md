## 2024-10-30 - MutationObserver React Layout Thrashing
**Learning:** Global `MutationObserver` on `document.body` observing `subtree: true` can fire multiple times per frame during frequent React micro-mutations. Synchronously running `document.querySelectorAll` in the callback causes severe layout thrashing and redundant O(N) traversals.
**Action:** Debounce global DOM queries inside `MutationObserver` callbacks using `requestAnimationFrame` to batch updates. In TypeScript strict mode, type the frame ID variable as `number | undefined` and check before calling `cancelAnimationFrame`.

## 2024-05-15 - Init
**Learning:** Initializing bolt journal.

## 2024-05-15 - IntersectionObserver DOM Thrashing in Reveal.tsx
**Learning:** The previous implementation of `Reveal.tsx` called `scan()` synchronously on every DOM mutation, iterating over `document.querySelectorAll('[data-reveal]')` each time. This causes synchronous layout/style recalculation (DOM thrashing) which degrades performance, especially during rapid consecutive mutations like route changes.
**Action:** Debounced/batched the DOM scanning using `requestAnimationFrame`. The `scan` is now only executed once per animation frame, and only when the mutation actually involves new elements being added to the tree.

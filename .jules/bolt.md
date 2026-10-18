## 2024-10-18 - Debouncing MutationObserver DOM Reads
**Learning:** Using `document.querySelectorAll` synchronously inside a `MutationObserver` callback causes severe layout thrashing and O(N) traversals multiple times per frame on frequent React micro-mutations.
**Action:** Always debounce heavy DOM reads like `document.querySelectorAll` inside `MutationObserver` callbacks using `requestAnimationFrame` to batch DOM reads and prevent main-thread blocking.

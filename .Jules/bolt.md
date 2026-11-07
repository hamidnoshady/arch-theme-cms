## 2024-11-08 - Debounce MutationObservers calling querySelectorAll

**Learning:** Global DOM mutations like `document.querySelectorAll`, when triggered by un-debounced `MutationObserver`s on frequent React micro-mutations, can lead to significant O(N) traversals per frame, resulting in layout thrashing.
**Action:** Always debounce heavy global DOM operations within `MutationObserver`s using `requestAnimationFrame` to batch updates and prevent main thread blocking during frequent DOM changes.

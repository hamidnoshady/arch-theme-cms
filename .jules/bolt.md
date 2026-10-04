## 2026-10-04 - O(N) Unscoped MutationObserver Document Scan
**Learning:** Using `document.querySelectorAll()` inside a `MutationObserver` callback triggers a full document O(N) scan on every mutation, causing main thread blocking and performance issues in heavy React updates.
**Action:** Scope the `querySelectorAll()` explicitly to the mutated `addedNodes` array from the `MutationRecord`. Iterate over the `addedNodes`, cast to Element if it is an ELEMENT_NODE, and use `el.querySelectorAll()` plus checking `el` itself to maintain an O(M) complexity.

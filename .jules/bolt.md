## 2024-05-15 - [Optimize Reveal MutationObserver]
**Learning:** Document-wide `querySelectorAll` on every mutation event is a major CPU bottleneck for pages with frequent DOM updates.
**Action:** Use `MutationRecord`'s `addedNodes` to scope queries locally when dealing with added elements, changing $O(N)$ whole-document traversal to $O(NewlyAddedNodes)$.

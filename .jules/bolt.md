## 2024-10-19 - Global MutationObserver Debouncing
**Learning:** In React applications with frequent micro-mutations, global `MutationObserver` callbacks that trigger heavy operations like `document.querySelectorAll` across the entire document body can cause layout thrashing and O(N) traversals multiple times per frame.
**Action:** Debounce global `MutationObserver` callbacks using `requestAnimationFrame` and clear pending animation frames appropriately on unmount or subsequent mutations. This ensures expensive scans run at most once per animation frame while preserving responsiveness.

## 2024-03-24 - O(N²) Loop to O(N) Adjacency Graph Traversal
**Learning:** Found a performance bottleneck in `src/lib/cms.ts` where gathering nested children over a deeply nested CMS category tree relied on a highly redundant `while(grew)` loop iteratively re-checking `parentId` constraints.
**Action:** Replace `while(grew)` loop with $O(N)$ adjacency list (mapping `parentId` to an array of children IDs) and traverse the tree safely via DFS stack, collecting the items in an efficient $O(N)$ single pass avoiding unnecessary looping.

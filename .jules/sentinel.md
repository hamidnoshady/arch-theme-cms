## 2023-11-20 - [Path Traversal in API Proxy]
**Vulnerability:** The `proxyToCms` function built a proxy URL by simply appending `apiPath` (from Next.js catch-all routes) directly onto a base URL. An attacker could craft a payload with `..` or `%2e%2e` to escape the intended `/api/` directory on the CMS and hit arbitrary admin endpoints (e.g., `https://cms.example.com/admin`).
**Learning:** Node.js's native `new URL(base + path)` resolves dot segments (`..`) *automatically*. The code trusted that mapping an endpoint via `[...path]` route segment safely contained the target.
**Prevention:** Always validate the *final resolved pathname* (using `target.pathname.startsWith(expectedPathBase)`) when constructing a URL with user-controlled path segments.

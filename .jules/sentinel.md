## 2023-10-27 - Added Security Headers
**Learning:** The `next.config.ts` did not define standard security HTTP headers like X-Frame-Options or X-XSS-Protection.
**Action:** Added an `async headers()` method in `next.config.ts` to return security headers for all paths (`/(.*)`). This improves security posture.

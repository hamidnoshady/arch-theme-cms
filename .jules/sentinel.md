## 2025-02-28 - [XSS Bypass via ASCII Control Characters in URL Schemes]
**Vulnerability:** The `safeHref` and `resolveLink` logic relied on standard regexes `^(https?:|mailto:|...):/i` to validate URL schemes, but did not filter out unencoded ASCII control characters (like `\t`, `\n`, `\x00`).
**Learning:** Browsers silently strip control characters (`[\u0000-\u001f\u007f]`) from URL schemes before evaluation. Therefore, a payload like `java\tscript:alert(1)` successfully bypassed the "safe scheme" regex check while still executing in the browser.
**Prevention:** Always strip ASCII control characters from strings prior to validating their URL scheme using a regex like `replace(/[\u0000-\u001f\u007f]/g, '')`.

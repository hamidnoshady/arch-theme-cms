## 2025-02-28 - URL Scheme Bypass via Control Characters
**Vulnerability:** XSS payload bypass in `safeHref` via control characters (e.g., `\x00javascript:alert(1)`).
**Learning:** URL sanitizers using regex pattern matching like `/^[a-z][a-z0-9+.-]*:/i.test(trimmed)` can be bypassed if C0 control characters and DEL (`[\u0000-\u001f\u007f]`) are present, because the browser ignores these characters but they break the regex matching logic.
**Prevention:** Always strip out C0 control characters and DEL before validating URL schemes.

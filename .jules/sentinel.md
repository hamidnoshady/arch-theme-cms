## 2024-05-24 - [XSS] Control characters bypass URL scheme validation
**Vulnerability:** The `safeHref` function correctly evaluated strings matching dangerous patterns like `javascript:` and blocked them, however it failed to properly account for invisible control characters like `\x00` and `\x01` that could precede the text.
**Learning:** Checking for malicious URL schemes in untrusted data requires stripping all invisible control characters out first, because standard `.trim()` only accounts for whitespace.
**Prevention:** Using a regex such as `replace(/[\u0000-\u001f\u007f]/g, '')` before executing trim and testing for schemes successfully prevents the evasion of scheme validation filters.

## 2024-05-24 - [Fix XSS bypass via control characters in URL validation]
**Vulnerability:** The `safeHref` URL validation allowed URLs containing C0 control characters (like tab or newline) which can bypass standard URL scheme validation logic because browsers strip them before parsing, potentially leading to XSS vulnerabilities.
**Learning:** Checking for safe URL schemes (`/^[a-z][a-z0-9+.-]*:/i`) is not enough since malicious payloads can insert unescaped control characters within the schema (e.g. `java\x09script:alert(1)`) to evade detection while remaining executable in browsers.
**Prevention:** Add a specific regex filter `[\u0000-\u001f\u007f]` to actively reject any strings containing C0 control characters or DEL before checking for valid protocols.

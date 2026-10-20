## 2025-02-21 - Control Character URL Validation Bypass
**Vulnerability:** XSS via `java\x09script:alert(1)` bypassing `isSafeLocalPath` and URL scheme validation due to hidden C0 control characters.
**Learning:** Checking for malicious URL schemes with regex (e.g. `javascript:`) is insufficient if `\x00-\x1F` and `\x7F` are present, as browsers strip them out at parse time, allowing the bypass to successfully execute.
**Prevention:** Always explicitly remove C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from user-provided URLs before checking their schema against an allow-list or block-list.

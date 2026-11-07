## 2024-11-07 - URL Control Character Evasion
**Vulnerability:** A Cross-Site Scripting (XSS) bypass existed in the URL sanitization logic of `safeHref`. Attackers could inject C0 control characters or DEL (e.g. `\x00`, `\n`) into dangerous URL schemes like `java\x00script:`, tricking the regex-based validation while still being executed by browsers.
**Learning:** Standard regex string matching for `^[a-z]+:` can be bypassed by non-printable characters unless they are explicitly blocked. Browsers are overly permissive and ignore these characters inside schemes.
**Prevention:** Always check and strip/block C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from user-provided URLs when validating URL schemes.

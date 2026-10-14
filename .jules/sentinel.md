## 2025-02-23 - Prevent XSS by Filtering C0 Control Characters

**Vulnerability:** The `safeHref` function validated URL schemes using a regex that didn't account for C0 control characters (`[\u0000-\u001f\u007f]`). This allowed malformed URLs like `\x00javascript:alert(1)` to bypass the safety checks and potentially cause XSS.
**Learning:** Standard regex string testing like `/^(https?:)/` may not protect against strings that begin with unprintable control characters, allowing harmful protocols to be executed by some browsers.
**Prevention:** Always explicitly test for and reject C0 control characters and DEL (`[\u0000-\u001f\u007f]`) before validating the scheme of a user-provided URL.

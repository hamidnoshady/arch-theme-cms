
## 2024-11-01 - XSS bypass via C0 control characters in URLs
**Vulnerability:** The URL scheme validation in `resolveLink` and `safeHref` could be bypassed using C0 control characters (like `\x09` tab) in strings like `java\x09script:alert(1)`.
**Learning:** Browsers strip control characters before parsing URLs. Regex checks for safe schemes (like `^(https?:|mailto:)`) will reject `javascript:` but might fail to reject strings with embedded control characters depending on how the regex is written. If the URL later executes, the browser strips the control characters and runs the payload.
**Prevention:** Always explicitly filter out C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from URLs before performing scheme validation or returning them to the DOM.

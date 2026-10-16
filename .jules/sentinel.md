
## 2024-05-16 - [XSS bypass in safeHref via control characters]
**Vulnerability:** The `safeHref` regex validation `(/^[a-z][a-z0-9+.-]*:/i)` could be bypassed by prefixing the URL string with a C0 control character (e.g. `\x01javascript:alert(1)`), resulting in XSS.
**Learning:** Browsers ignore control characters when parsing URLs, so validation regexes must explicitly account for or strip control characters before evaluating scheme prefixes to be safe.
**Prevention:** Always strip out C0 control characters and DEL (`[\u0000-\u001f\u007f]`) before validating or returning URL inputs using regex.

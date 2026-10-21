## 2023-10-21 - XSS Bypass via Null Bytes in URL Validation
**Vulnerability:** The application's `safeHref` and `resolveLink` logic used regular expressions to validate URL schemes, which failed to account for C0 control characters (like `\x00`). Attackers could use these characters to bypass the check, allowing malicious `javascript:` schemes to execute.
**Learning:** Browsers strip control characters before evaluating URLs, but standard JavaScript regex testing does not unless explicitly handled. This allows for bypasses in validation logic.
**Prevention:** Always strip C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from strings prior to validating URL schemes to ensure the tested string aligns with how the browser parses the URL.

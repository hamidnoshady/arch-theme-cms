## 2024-05-18 - [Input validation bypass via C0 Control Characters]
**Vulnerability:** The URL scheme validation in `safeHref` could be bypassed by inserting C0 control characters (e.g., `\x00`, `\n`, `\t`) into the scheme (like `java\nscript:alert(1)`), causing standard regexes to fail to recognize the payload as a dangerous scheme.
**Learning:** Browsers ignore C0 control characters and DEL (`[\u0000-\u001f\u007f]`) when interpreting `href` attributes, which can bypass backend scheme validations that don't account for them.
**Prevention:** Explicitly reject any input string containing C0 control characters or DEL after trimming, or strip them before further validation.

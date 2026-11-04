
## 2025-02-27 - [Prevent URL Scheme Obfuscation]
**Vulnerability:** XSS possible via URL scheme obfuscation using C0 control characters and DEL in URLs (e.g., `java\x00script:alert(1)`).
**Learning:** Regular expression checks for URL schemes (like `^(https?:|mailto:|tel:|geo:|#)`) can be bypassed if the URL string contains invisible control characters, which browsers may strip or ignore before execution.
**Prevention:** Always explicitly test for and filter out control characters (`[\u0000-\u001f\u007f]`) when sanitizing URLs, in addition to strictly allowlisting specific safe schemes.

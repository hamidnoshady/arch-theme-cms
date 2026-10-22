## 2025-02-23 - URL Scheme Validation Bypass via Control Characters
**Vulnerability:** XSS payload obfuscation via control characters bypasses URL scheme checks.
**Learning:** Browsers ignore certain C0 control characters in URLs and still execute the underlying scheme (e.g., `java\x09script:alert(1)`), but standard validation regexes like `/^[a-z][a-z0-9+.-]*:/i` fail to recognize the scheme when these characters are present, resulting in a dangerous false negative where malicious scripts are passed through.
**Prevention:** Always strip C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from URL inputs *before* applying validation checks.

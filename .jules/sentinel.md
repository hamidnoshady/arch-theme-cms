## 2024-10-24 - [CRITICAL] Fix XSS Vulnerability in Link URL Validation

**Vulnerability:** The `safeHref` function in `src/lib/links.ts` fails to adequately sanitize control characters like tab `\x09` or null characters when checking for dangerous schemes. It simply calls `.trim()` and then runs regex checks like `/^[a-z][a-z0-9+.-]*:/i`. This allows a malicious payload like `java\x09script:alert(1)` or `javascript&#00009;:alert(1)` to bypass the scheme filter because the regex expects only alphabetic characters at the beginning. By placing a non-alphanumeric character within the scheme identifier, the test `/^[a-z][a-z0-9+.-]*:/i.test(trimmed)` evaluates to `false`, treating it as a non-scheme safe URL and returning it, which a browser will execute as Javascript.

**Learning:** URL scheme validation via naive regex matching can be easily bypassed if the string can contain control characters which the browser's parser ignores but standard regex schemes check reject. The browser will strip C0 control characters before parsing the scheme, turning an apparently safe string back into a dangerous `javascript:` payload.

**Prevention:** Before performing any scheme checks, explicitly strip C0 control characters and DEL (`[\u0000-\u001f\u007f]`) from the string so that validation runs on what the browser will actually see and execute.

## 2025-02-27 - URL Control Character Bypass
**Vulnerability:** URL sanitization regex bypassing via C0 control characters and DEL (`[\u0000-\u001f\u007f]`).
**Learning:** Standard scheme checks (like `/^https?:/`) can be bypassed if malicious payloads prepend hidden control characters (e.g., NUL bytes or vertical tabs) because standard JavaScript `trim()` only removes a subset of whitespace, not all control characters.
**Prevention:** Explicitly filter out the entire C0 control character range and DEL (`[\u0000-\u001f\u007f]`) *after* standard trimming (to avoid stripping valid leading/trailing spaces/newlines that might be in the CMS data) to ensure robust URL sanitization.

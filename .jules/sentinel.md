## 2024-05-18 - Open Redirect Vulnerability
**Vulnerability:** Open Redirect / Potential XSS in `safeFormRedirect` and `preview/route.ts` via paths starting with `/\`.
**Learning:** `startsWith('//')` does not prevent malicious URLs like `/\evil.com` which are treated as absolute URLs by browsers (e.g. `window.location.assign`) and by URL constructors, bypassing standard relative path validations.
**Prevention:** Check for both `//` and `/\` when ensuring a string is a safe relative path, or use a proper URL parsing library to enforce same-origin policies.

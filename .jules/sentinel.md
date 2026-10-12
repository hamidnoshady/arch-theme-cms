## 2024-10-13 - [CRITICAL] Prevent XSS in Intro Script

**Vulnerability:** XSS via unvalidated `durationMs` parameter injected into a `<script>` block using `dangerouslySetInnerHTML` in `src/views/HomeView.tsx`.
**Learning:** Data from the CMS (such as theme settings for animation duration) can be manipulated if the CMS is compromised, or due to a type mismatch. Passing this directly into string templates inside `<script>` blocks allows for Stored XSS execution, which could be used to compromise the application.
**Prevention:** Always coerce types (e.g., `Number(durationMs)`) or serialize data correctly (e.g., `JSON.stringify()`) when interpolating values into JavaScript string templates, especially within `dangerouslySetInnerHTML`.

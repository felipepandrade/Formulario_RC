## 2024-05-24 - [mailto: Link Truncation DoS & NaN Logic Bypass]
**Vulnerability:** Input fields of type `number` when cleared return `NaN`, bypassing logical checks like `<= 0`. Mailto URIs exceeding 2000 chars fail silently on many browsers causing a localized DoS.
**Learning:** `NaN <= 0` evaluates to `false`, which incorrectly passes standard negative value checks. In client-side only architectures, large datasets passed via URL or URI schema crash silently.
**Prevention:** Always validate numeric types against `isNaN()` alongside bounds checks. Implement maximum length checks on the generated URI (`mailtoLink.length > 2000`) before triggering `window.location.href` to warn the user.

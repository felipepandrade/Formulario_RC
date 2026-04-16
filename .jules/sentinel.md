## 2024-05-15 - NaN Logic Bypass & Mailto DoS
**Vulnerability:** Input fields of type `number` when cleared return `NaN`, bypassing logical checks like `<= 0`. Mailto URIs exceeding 2000 chars fail silently on many browsers causing a localized DoS.
**Learning:** `NaN <= 0` evaluates to `false`, which incorrectly passes standard negative value checks. In client-side only architectures, large datasets passed via URL or URI schema crash silently.
**Prevention:** Always validate numeric types against `isNaN()` alongside bounds checks. Enforce `maxLength` on form inputs and check final URI length before triggering browser-based navigation or `mailto:` actions.

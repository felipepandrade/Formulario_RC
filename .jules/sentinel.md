## 2024-05-24 - [mailto: Link Truncation DoS]
**Vulnerability:** Client-side architectures relying on `mailto:` links are susceptible to a silent DoS when the URI length exceeds the browser or email client limits (typically around 2000 characters). This causes data loss without user notification.
**Learning:** Browsers and email clients have hard limits on the length of URIs, leading to silent failure when trying to open large forms using a `mailto:` link.
**Prevention:** Implement maximum length checks on the generated URI (`mailtoLink.length > 2000`) before triggering `window.location.href` to warn the user and prevent data truncation.

## 2025-01-24 - [Insecure Randomness for ID Generation]
**Vulnerability:** Use of `Math.random()` for generating unique identifiers (IDs). `Math.random()` is not cryptographically secure and can be predictable, which may lead to ID collisions or predictability in sensitive contexts.
**Learning:** For generating unique and secure identifiers, `crypto.randomUUID()` should be used as it provides a cryptographically strong random number generator.
**Prevention:** Avoid `Math.random()` for security-sensitive operations or ID generation. Use the Web Crypto API's `crypto.randomUUID()` or `crypto.getRandomValues()` instead.

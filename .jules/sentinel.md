## 2024-05-24 - [mailto: Link Truncation DoS]
**Vulnerability:** Client-side architectures relying on `mailto:` links are susceptible to a silent DoS when the URI length exceeds the browser or email client limits (typically around 2000 characters). This causes data loss without user notification.
**Learning:** Browsers and email clients have hard limits on the length of URIs, leading to silent failure when trying to open large forms using a `mailto:` link.
**Prevention:** Implement maximum length checks on the generated URI (`mailtoLink.length > 2000`) before triggering `window.location.href` to warn the user and prevent data truncation.

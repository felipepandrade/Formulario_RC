## 2026-04-27 - Hoist React static constants outside component
**Learning:** Moving string constants outside functional components avoids their recreation on every render.
**Action:** Use SCREAMING_SNAKE_CASE for module-level constants and move static strings out of the render loop to save memory allocation overhead.

## 2026-04-16 - [Memoization Invalidation by Array Length Prop]
**Learning:** Passing `items.length` to each memoized child component (`RequisitionItemCard`) invalidates the `React.memo` cache for *all* items whenever a new item is added or removed. Even though the actual component data didn't change, the `totalItems` prop changed for every instance, forcing an O(N) re-render instead of O(1).
**Action:** Replace dynamic length props (like `totalItems`) with static boolean flags (like `canRemove={items.length > 1}`). Since `canRemove` remains `true` for all items (except when length goes from 2 to 1), adding a 3rd, 4th, or Nth item won't change the `canRemove` prop of existing items, preserving memoization.

## 2026-04-17 - [Global State Invalidating Complex Item Lists]
**Learning:** When multiple complex inputs in a deeply nested, dynamic list form (`items`) are updated independently of global form fields (`requester`, `location`), typing in a global field forces a complete top-down re-render. Since `items` maps over its children and generates JSX tags on every render, even with `React.memo` on the child component, React still performs shallow comparisons for O(N) items.
**Action:** Pre-memoize the rendering of complex list mappings (`const renderedItems = useMemo(() => items.map(...), [items, ...])`) when they are pure with respect to their own item state and do not depend on sibling top-level state. This avoids O(N) map operations and `React.memo` prop comparisons entirely when typing in unrelated global inputs.
## 2025-05-19 - Hoist inline styles
**Learning:** Inline objects like `style={{ objectFit: 'contain' }}` passed to React components create new object references on every render, adding overhead and potentially breaking memoization of child components.
**Action:** Extract static style objects outside functional components to constants (e.g., `const LOGO_STYLE = { objectFit: 'contain' };`) to avoid this allocation overhead.

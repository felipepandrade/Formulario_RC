## 2026-04-15 - Prevent O(N) list re-renders
**Learning:** In complex React forms rendering many large sub-items, inline components or mapping inside the parent leads to O(N) re-renders for every keystroke. Extracting list items to a separate component and using React.memo() along with stable useCallback references is crucial.
**Action:** When encountering large lists of form items, always extract them to memoized components and ensure parent callback props are wrapped in useCallback with functional state updates.

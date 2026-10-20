import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// The form saves a draft in localStorage; start every test with a clean form.
afterEach(() => {
  localStorage.clear();
});

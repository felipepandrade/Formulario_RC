import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

// jsdom does not implement scrolling; the app only uses it to bring fields into view.
window.scrollTo = () => {};

// The form saves a draft in localStorage; start every test with a clean form.
afterEach(() => {
  localStorage.clear();
});

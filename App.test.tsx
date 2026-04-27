
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    // Mock crypto.randomUUID if not available in the test environment
    if (typeof crypto.randomUUID !== 'function') {
      Object.defineProperty(global, 'crypto', {
        value: {
          randomUUID: () => '12345678-1234-1234-1234-123456789012'
        },
        writable: true
      });
    }
  });

  it('generates a valid UUID when adding a new item', () => {
    const randomUUIDSpy = vi.spyOn(crypto, 'randomUUID');

    render(<App />);

    const addButton = screen.getByText(/Adicionar Outro Item/i);
    fireEvent.click(addButton);

    expect(randomUUIDSpy).toHaveBeenCalled();

    // Verify it's a UUID (simplified check)
    const uuid = randomUUIDSpy.mock.results[0].value;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuid).toMatch(uuidRegex);
  });
});

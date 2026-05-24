
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

  describe('Item Removal Logic', () => {
    it('does not show the remove button when there is only one item', () => {
      render(<App />);
      expect(screen.queryByTitle('Remover Item')).not.toBeInTheDocument();
    });

    it('shows the remove button for all items when more than one item is present', () => {
      render(<App />);
      const addButton = screen.getByText(/Adicionar Outro Item/i);

      fireEvent.click(addButton);

      const removeButtons = screen.getAllByTitle('Remover Item');
      expect(removeButtons).toHaveLength(2);
    });

    it('removes the correct item when the remove button is clicked', () => {
      render(<App />);
      const addButton = screen.getByText(/Adicionar Outro Item/i);

      // Add two more items (total 3)
      fireEvent.click(addButton);
      fireEvent.click(addButton);

      const items = screen.getAllByText(/Item da Requisição/i);
      expect(items).toHaveLength(3);

      // Give descriptions to items to identify them
      const descriptions = screen.getAllByPlaceholderText(/Descreva o material/i);
      fireEvent.change(descriptions[0], { target: { value: 'Item 1 Description' } });
      fireEvent.change(descriptions[1], { target: { value: 'Item 2 Description' } });
      fireEvent.change(descriptions[2], { target: { value: 'Item 3 Description' } });

      // Remove the second item (index 1)
      const removeButtons = screen.getAllByTitle('Remover Item');
      fireEvent.click(removeButtons[1]);

      // Verify remaining items
      const remainingItems = screen.getAllByText(/Item da Requisição/i);
      expect(remainingItems).toHaveLength(2);

      const remainingDescriptions = screen.getAllByPlaceholderText(/Descreva o material/i) as HTMLTextAreaElement[];
      expect(remainingDescriptions[0].value).toBe('Item 1 Description');
      expect(remainingDescriptions[1].value).toBe('Item 3 Description');
    });

    it('hides the remove button when decreasing from two items to one', () => {
      render(<App />);
      const addButton = screen.getByText(/Adicionar Outro Item/i);

      fireEvent.click(addButton);
      expect(screen.getAllByTitle('Remover Item')).toHaveLength(2);

      const removeButtons = screen.getAllByTitle('Remover Item');
      fireEvent.click(removeButtons[0]);

      expect(screen.queryByTitle('Remover Item')).not.toBeInTheDocument();
    });
  });
});

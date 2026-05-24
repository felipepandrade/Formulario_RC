
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

vi.mock('./constants', async () => {
  const actual = (await vi.importActual('./constants')) as any;
  return {
    ...actual,
    LOCATIONS: [
      ...actual.LOCATIONS,
      { label: 'Unmapped Location', value: 'UNMAPPED' },
    ],
  };
});

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

  it('shows error when email mapping is missing for the selected location', () => {
    render(<App />);

    // Fill in identification
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'UNMAPPED' } });

    // Fill in item details
    fireEvent.change(screen.getByLabelText(/Descrição/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '5' } });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Fornecedor' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Acordo de compra contratual' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Despesa' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'SOLUC_USO E CONSUMO' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'MATERIAL CONSUMO' } });
    fireEvent.change(screen.getByLabelText(/Justificativa/i), { target: { value: 'Necessary for testing' } });

    // Submit form
    const submitButton = screen.getByText(/Abrir no Outlook/i);
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText('E-mail não encontrado para a base selecionada.')).toBeInTheDocument();
  });
});

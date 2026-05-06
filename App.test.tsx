
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

  it('prevents submission when the mailto link exceeds the length limit', () => {
    render(<App />);

    // Fill mandatory fields
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'ESOM_F_CATU_OI' } });

    // Provide a very long description to exceed 2000 characters
    const longDescription = 'A'.repeat(2500);
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: longDescription } });

    // Fill other mandatory fields to pass initial validation
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Preço Unit. Estimado/i), { target: { value: '100' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Fornecedor' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Acordo de compra contratual' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Estoque' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'SOLUC_ATIVO IMOBILIZADO' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'ATIVO IMOBILIZADO' } });
    fireEvent.change(screen.getByLabelText(/Justificativa Técnica/i), { target: { value: 'Justificativa' } });

    const submitButton = screen.getByRole('button', { name: /Abrir no Outlook/i });
    fireEvent.click(submitButton);

    expect(screen.getByText(/O tamanho da solicitação excede o limite do cliente de e-mail/i)).toBeInTheDocument();
  });

  it('validates quantity and price against NaN and non-positive values', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'ESOM_F_CATU_OI' } });
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: 'Desc' } });

    const submitButton = screen.getByRole('button', { name: /Abrir no Outlook/i });

    // Test Quantity <= 0
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '0' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Quantidade deve ser maior que 0/i)).toBeInTheDocument();

    // Test Quantity is NaN (empty input for number can result in NaN when parsed)
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Quantidade deve ser maior que 0/i)).toBeInTheDocument();

    // Reset Quantity and test Price <= 0
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Preço Unit. Estimado/i), { target: { value: '0' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Preço é obrigatório/i)).toBeInTheDocument();

    // Test Price is NaN
    fireEvent.change(screen.getByLabelText(/Preço Unit. Estimado/i), { target: { value: '' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/Preço é obrigatório/i)).toBeInTheDocument();
  });
});

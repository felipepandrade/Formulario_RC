
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

  it('shows error message when mailto link exceeds limit', () => {
    render(<App />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'ESOM_F_CATU_OI' } });

    // Fill required item fields with a very long description
    const longDescription = 'A'.repeat(2100);
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: longDescription } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Fornecedor' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Acordo de compra contratual' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Despesa' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'SOLUC_SERVICO' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'PRESTAÇÃO DE SERVIÇO' } });
    fireEvent.change(screen.getByLabelText(/Justificativa Técnica/i), { target: { value: 'Technical justification' } });

    // Submit form
    const submitButton = screen.getByText(/Abrir no Outlook/i);
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText(/O tamanho da solicitação excede o limite do cliente de e-mail/i)).toBeInTheDocument();
  });

  it('validates quantity is greater than 0', () => {
    render(<App />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'ESOM_F_CATU_OI' } });

    // Set invalid quantity
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '0' } });

    // Other required item fields
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Fornecedor' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Acordo de compra contratual' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Despesa' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'SOLUC_SERVICO' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'PRESTAÇÃO DE SERVIÇO' } });
    fireEvent.change(screen.getByLabelText(/Justificativa Técnica/i), { target: { value: 'Technical justification' } });

    // Submit form
    const submitButton = screen.getByText(/Abrir no Outlook/i);
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText(/Quantidade deve ser maior que 0/i)).toBeInTheDocument();
  });

  it('validates price is provided and greater than 0', () => {
    render(<App />);

    // Fill required fields
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'John Doe' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'ESOM_F_CATU_OI' } });

    // Set invalid price
    fireEvent.change(screen.getByLabelText(/Preço Unit. Estimado \(R\$\)/i), { target: { value: '' } });

    // Other required item fields
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: 'Test Item' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Fornecedor' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Acordo de compra contratual' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Despesa' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'SOLUC_SERVICO' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'PRESTAÇÃO DE SERVIÇO' } });
    fireEvent.change(screen.getByLabelText(/Justificativa Técnica/i), { target: { value: 'Technical justification' } });

    // Submit form
    const submitButton = screen.getByText(/Abrir no Outlook/i);
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText(/Preço é obrigatório/i)).toBeInTheDocument();
  });
});

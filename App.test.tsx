
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from './App';

describe('App Component - Security Fixes', () => {
  beforeEach(() => {
    // Mock window.location.href
    const location = new URL('http://localhost');
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { ...window.location, href: location.href },
    });
  });

  it('shows error message when mailto link exceeds 2000 characters', () => {
    render(<App />);

    // Fill in required fields
    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'Test Requester' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'Aratu' } });

    // Fill in item 1 details
    // Need to find the inputs within the card. RequisitionItemCard uses Input component.
    // Label for description is "Descrição Detalhada"
    const descriptionInput = screen.getByLabelText(/Descrição Detalhada/i);
    const largeDescription = 'A'.repeat(2100);
    fireEvent.change(descriptionInput, { target: { value: largeDescription } });

    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '100' } });

    // Select required options
    fireEvent.change(screen.getByLabelText(/Tipo de Origem/i), { target: { value: 'Estoque' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Acordo/i), { target: { value: 'Contrato' } });
    fireEvent.change(screen.getByLabelText(/Tipo de Destino/i), { target: { value: 'Consumo' } });
    fireEvent.change(screen.getByLabelText(/Uso Pretendido/i), { target: { value: 'Operação' } });
    fireEvent.change(screen.getByLabelText(/Objetivo da RC/i), { target: { value: 'Reposição' } });

    const justificationInput = screen.getByLabelText(/Justificativa Técnica/i);
    fireEvent.change(justificationInput, { target: { value: 'Test justification' } });

    // Submit form
    const submitButton = screen.getByText(/Abrir no Outlook/i);
    fireEvent.click(submitButton);

    // Verify error message
    expect(screen.getByText(/O tamanho da solicitação excede o limite do cliente de e-mail/i)).toBeInTheDocument();
  });

  it('shows error message when quantity is NaN', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'Test Requester' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'Aratu' } });
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: 'Test Description' } });

    // Simulate NaN by clearing input or non-numeric value if type allows
    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '' } });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '100' } });

    fireEvent.click(screen.getByText(/Abrir no Outlook/i));

    expect(screen.getByText(/Quantidade deve ser maior que 0/i)).toBeInTheDocument();
  });

  it('shows error message when price is NaN', () => {
    render(<App />);

    fireEvent.change(screen.getByLabelText(/Solicitante/i), { target: { value: 'Test Requester' } });
    fireEvent.change(screen.getByLabelText(/Local para Entrega/i), { target: { value: 'Aratu' } });
    fireEvent.change(screen.getByLabelText(/Descrição Detalhada/i), { target: { value: 'Test Description' } });

    fireEvent.change(screen.getByLabelText(/Quantidade/i), { target: { value: '1' } });
    fireEvent.change(screen.getByLabelText(/Preço/i), { target: { value: '' } });

    fireEvent.click(screen.getByText(/Abrir no Outlook/i));

    expect(screen.getByText(/Preço é obrigatório/i)).toBeInTheDocument();
  });
});

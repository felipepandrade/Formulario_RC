import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import App from './App';
import { DRAFT_STORAGE_KEY } from './utils/draft';

vi.mock('./constants', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./constants')>();
  return { ...actual, EMAIL_MAPPING: { ESOM_F_CATU_OI: 'compras@example.com' } };
});

const originalLocation = window.location;
const writeText = vi.fn();

function fillValidForm(justification = 'Necessário para manutenção.') {
  fireEvent.change(screen.getByLabelText(/Solicitante/), { target: { value: 'João' } });
  fireEvent.change(screen.getByLabelText(/Local para Entrega/), { target: { value: 'ESOM_F_CATU_OI' } });
  fireEvent.change(screen.getByLabelText(/Descrição Detalhada/), { target: { value: 'Válvula' } });
  fireEvent.change(screen.getByLabelText(/Preço Unit/), { target: { value: '1.500,50' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Origem/), { target: { value: 'Fornecedor' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Acordo/), { target: { value: 'Acordo de compra em aberto' } });
  fireEvent.change(screen.getByLabelText(/Objetivo da RC/), { target: { value: 'MATERIAL CONSUMO' } });
  fireEvent.change(screen.getByLabelText(/Uso Pretendido/), { target: { value: 'SOLUC_USO E CONSUMO' } });
  fireEvent.change(screen.getByLabelText(/Tipo de Destino/), { target: { value: 'Despesa' } });
  fireEvent.change(screen.getByLabelText(/Justificativa Técnica/), { target: { value: justification } });
}

describe('App submission', () => {
  beforeEach(() => {
    writeText.mockReset().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    Object.defineProperty(window, 'location', { value: { href: '' }, writable: true, configurable: true });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true, configurable: true });
  });

  it('opens the e-mail with the full requisition when it fits in the link', async () => {
    render(<App />);
    fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    await waitFor(() => expect(window.location.href).toMatch(/^mailto:compras@example\.com\?subject=/));
    const body = decodeURIComponent(window.location.href.split('&body=')[1]);
    expect(body).toContain('PREÇO UNIT. EST.: R$ 1.500,50');
    expect(body).toContain('VALOR TOTAL ESTIMADO: R$ 1.500,50');
    expect(writeText).not.toHaveBeenCalled();
  });

  it('copies a long requisition and still opens the e-mail with recipient and subject', async () => {
    render(<App />);
    fillValidForm('Justificativa muito longa. '.repeat(120));
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    await waitFor(() => expect(window.location.href).toMatch(/^mailto:compras@example\.com\?subject=/));
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Justificativa muito longa.'));
    expect(decodeURIComponent(window.location.href)).toContain('cole aqui com Ctrl+V');
    expect(window.location.href.length).toBeLessThan(2000);
    expect(screen.getByRole('status')).toHaveTextContent(/texto completo foi copiado/);
  });

  it('marks invalid fields and moves focus to the first one', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Abrir no Outlook/i }));

    const requester = screen.getByLabelText(/Solicitante/);
    expect(requester).toHaveAttribute('aria-invalid', 'true');
    expect(requester).toHaveAccessibleDescription('Solicitante é obrigatório.');
    expect(screen.getByRole('alert')).toHaveTextContent('Solicitante é obrigatório.');
    await waitFor(() => expect(requester).toHaveFocus());
    expect(window.location.href).toBe('');
  });
});

describe('App draft', () => {
  it('restores the saved draft and clears it on request', async () => {
    const { unmount } = render(<App />);
    fireEvent.change(screen.getByLabelText(/Solicitante/), { target: { value: 'Maria' } });
    await waitFor(() => expect(localStorage.getItem(DRAFT_STORAGE_KEY)).toContain('Maria'));
    unmount();

    render(<App />);
    expect(screen.getByLabelText(/Solicitante/)).toHaveValue('Maria');

    vi.spyOn(window, 'confirm').mockReturnValue(true);
    fireEvent.click(screen.getByRole('button', { name: /Limpar formulário/i }));
    expect(screen.getByLabelText(/Solicitante/)).toHaveValue('');
  });
});
